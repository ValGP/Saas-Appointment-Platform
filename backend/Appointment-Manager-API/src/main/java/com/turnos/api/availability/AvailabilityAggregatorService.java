package com.turnos.api.availability;

import com.turnos.api.common.ResourceNotFoundException;
import com.turnos.api.professionals.Professional;
import com.turnos.api.professionals.ProfessionalRepository;
import com.turnos.api.professionals.ProfessionalServiceAssignmentService;
import com.turnos.api.services.ServiceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Orchestrates availability across multiple professionals and exposes a single
 * unified view to the frontend.
 *
 * <p>The frontend never interacts with individual professional schedules. It only
 * asks "what slots are available for this service on this date?" and receives a
 * clean, merged list regardless of how many professionals cover it.</p>
 *
 * <p>Two operating modes:</p>
 * <ul>
 *   <li><b>Specific professional</b> ({@code professionalId != null}): delegates directly
 *       to {@link AvailabilityService#getAvailabilityForProfessional} after loading
 *       and validating the requested professional. Returns slots with
 *       {@code availableProfessionalsCount = null} (the count is meaningless when the
 *       client already chose a specific person).</li>
 *   <li><b>Any available</b> ({@code professionalId == null}): fetches all professionals
 *       assigned to the service, filters active ones, calculates availability for each,
 *       merges the results, annotates each merged slot with the count of professionals
 *       that can cover it, and returns the unified list sorted chronologically.</li>
 * </ul>
 */
@Service
public class AvailabilityAggregatorService {

    private final AvailabilityService availabilityService;
    private final ProfessionalServiceAssignmentService professionalServiceAssignmentService;
    private final ProfessionalRepository professionalRepository;
    private final ServiceRepository serviceRepository;

    public AvailabilityAggregatorService(
            AvailabilityService availabilityService,
            ProfessionalServiceAssignmentService professionalServiceAssignmentService,
            ProfessionalRepository professionalRepository,
            ServiceRepository serviceRepository
    ) {
        this.availabilityService = availabilityService;
        this.professionalServiceAssignmentService = professionalServiceAssignmentService;
        this.professionalRepository = professionalRepository;
        this.serviceRepository = serviceRepository;
    }

    /**
     * Returns the unified available slots for a service on a given date.
     *
     * @param serviceId      the service to be rendered
     * @param date           the calendar date to query
     * @param professionalId optional; if null, all active professionals are considered
     * @return sorted list of public-facing available slots
     */
    @Transactional(readOnly = true)
    public List<AvailableSlotResponse> getAvailableSlots(
            Long serviceId,
            LocalDate date,
            Long professionalId
    ) {
        com.turnos.api.services.Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Service", serviceId));

        if (professionalId != null) {
            return getSlotsForSpecificProfessional(service, date, professionalId);
        }

        return getMergedSlotsForAnyProfessional(service, date);
    }

    // ─── Private: specific professional mode ─────────────────────────────────

    /**
     * Calculates slots for one specific professional and wraps them with
     * {@code availableProfessionalsCount = null}.
     */
    private List<AvailableSlotResponse> getSlotsForSpecificProfessional(
            com.turnos.api.services.Service service,
            LocalDate date,
            Long professionalId
    ) {
        Professional professional = professionalRepository.findById(professionalId)
                .orElseThrow(() -> new ResourceNotFoundException("Professional", professionalId));

        if (!professional.canAttendAppointments()) {
            return List.of();
        }

        return availabilityService
                .getAvailabilityForProfessional(professional, service, date)
                .stream()
                .map(slot -> AvailableSlotResponse.forSpecificProfessional(slot.startDateTime(), slot.endDateTime()))
                .sorted(Comparator.comparing(AvailableSlotResponse::start))
                .toList();
    }

    // ─── Private: any available mode ─────────────────────────────────────────

    /**
     * Merges availability across all active professionals assigned to the service.
     *
     * <p>Algorithm:</p>
     * <ol>
     *   <li>Find all professionals assigned to the service (respects ALL_SERVICES mode).</li>
     *   <li>Filter: keep only active professionals ({@code canAttendAppointments()}).</li>
     *   <li>For each active professional, calculate available slots via
     *       {@link AvailabilityService#getAvailabilityForProfessional}.</li>
     *   <li>Build a frequency map keyed by slot start time. For each start time,
     *       track how many professionals can cover that slot.</li>
     *   <li>Convert to {@link AvailableSlotResponse} using the earliest {@code end}
     *       time found for that start (all professionals use the same service duration,
     *       so end times are identical for the same start).</li>
     *   <li>Return the list sorted chronologically.</li>
     * </ol>
     */
    private List<AvailableSlotResponse> getMergedSlotsForAnyProfessional(
            com.turnos.api.services.Service service,
            LocalDate date
    ) {
        List<Professional> candidates = professionalServiceAssignmentService
                .findProfessionalsForService(service.getId())
                .stream()
                .filter(Professional::canAttendAppointments)
                .toList();

        if (candidates.isEmpty()) {
            return List.of();
        }

        // start → [end, count]  (LinkedHashMap preserves insertion order as a bonus)
        record SlotAggregation(java.time.LocalDateTime end, int count) {}
        Map<java.time.LocalDateTime, SlotAggregation> frequencyMap = new LinkedHashMap<>();

        for (Professional professional : candidates) {
            List<AvailabilitySlotResponse> slots =
                    availabilityService.getAvailabilityForProfessional(professional, service, date);

            for (AvailabilitySlotResponse slot : slots) {
                frequencyMap.merge(
                        slot.startDateTime(),
                        new SlotAggregation(slot.endDateTime(), 1),
                        (existing, incoming) -> new SlotAggregation(existing.end(), existing.count() + 1)
                );
            }
        }

        List<AvailableSlotResponse> merged = new ArrayList<>(frequencyMap.size());
        frequencyMap.forEach((start, agg) ->
                merged.add(AvailableSlotResponse.forAnyProfessional(start, agg.end(), agg.count()))
        );

        merged.sort(Comparator.comparing(AvailableSlotResponse::start));
        return merged;
    }
}
