package com.turnos.api.appointments;

import com.turnos.api.availability.AvailabilityBlock;
import com.turnos.api.availability.AvailabilityBlockRepository;
import com.turnos.api.availability.BusinessHoursRepository;
import com.turnos.api.common.ConflictException;
import com.turnos.api.professionals.Professional;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * MVP implementation of {@link ProfessionalAssignmentStrategy}.
 *
 * <p>Iterates the candidate list in order and returns the <b>first professional
 * whose schedule accommodates the requested slot</b>. A candidate is accepted
 * when all three conditions are true for the requested [{@code start}, {@code end})
 * window:</p>
 * <ol>
 *   <li><b>Inside business hours:</b> at least one active
 *       {@link com.turnos.api.availability.BusinessHours} record for that professional
 *       on that day of the week fully contains the requested range.</li>
 *   <li><b>No overlapping appointments:</b> no existing appointment with status
 *       {@code PENDING} or {@code CONFIRMED} overlaps the window.</li>
 *   <li><b>No active blocks:</b> no active
 *       {@link com.turnos.api.availability.AvailabilityBlock} overlaps the window.</li>
 * </ol>
 *
 * <p>If no candidate passes all three checks a
 * {@link ConflictException} is thrown so the API returns HTTP 409.</p>
 *
 * <p>Future strategies (e.g. least-loaded, round-robin) can be registered as
 * additional Spring {@code @Component}s and swapped via configuration without
 * touching {@link AppointmentService}.</p>
 */
@Component
public class FirstAvailableStrategy implements ProfessionalAssignmentStrategy {

    private static final List<AppointmentStatus> OCCUPYING_STATUSES = List.of(
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED
    );

    private final BusinessHoursRepository businessHoursRepository;
    private final AppointmentRepository appointmentRepository;
    private final AvailabilityBlockRepository availabilityBlockRepository;

    public FirstAvailableStrategy(
            BusinessHoursRepository businessHoursRepository,
            AppointmentRepository appointmentRepository,
            AvailabilityBlockRepository availabilityBlockRepository
    ) {
        this.businessHoursRepository = businessHoursRepository;
        this.appointmentRepository = appointmentRepository;
        this.availabilityBlockRepository = availabilityBlockRepository;
    }

    /**
     * {@inheritDoc}
     *
     * <p>Candidates are evaluated in the order provided. The first one that
     * satisfies all three conditions (business hours, no appointment overlap,
     * no block overlap) is returned immediately — no further candidates are
     * evaluated.</p>
     */
    @Override
    public Professional resolve(
            com.turnos.api.services.Service service,
            LocalDateTime start,
            LocalDateTime end,
            List<Professional> candidates
    ) {
        for (Professional candidate : candidates) {
            if (isAvailable(candidate.getId(), start, end)) {
                return candidate;
            }
        }
        throw new ConflictException(
                "No professionals are available for the selected time slot. " +
                "Please choose a different date or time."
        );
    }

    // ─── Private helper ───────────────────────────────────────────────────────

    /**
     * Returns {@code true} if the professional has no conflicts for the given window.
     *
     * <p>Mirrors the three-step check in
     * {@code AppointmentService.validateAvailability}, but returns a boolean
     * instead of throwing — allowing the caller to try the next candidate.</p>
     */
    private boolean isAvailable(Long professionalId, LocalDateTime start, LocalDateTime end) {
        // 1. Must be inside at least one active business-hours window
        boolean insideBusinessHours = businessHoursRepository
                .findByProfessionalIdAndDayOfWeekAndActiveTrue(professionalId, start.getDayOfWeek())
                .stream()
                .anyMatch(hours -> hours.containsRange(start, end));
        if (!insideBusinessHours) {
            return false;
        }

        // 2. Must not overlap any existing PENDING or CONFIRMED appointment
        boolean overlapsAppointment = !appointmentRepository
                .findByProfessionalIdAndStatusInAndStartDateTimeBeforeAndEndDateTimeAfter(
                        professionalId,
                        OCCUPYING_STATUSES,
                        end,
                        start
                )
                .isEmpty();
        if (overlapsAppointment) {
            return false;
        }

        // 3. Must not overlap any active availability block
        List<AvailabilityBlock> blocks = availabilityBlockRepository
                .findByProfessionalIdAndActiveTrueAndStartDateTimeBeforeAndEndDateTimeAfter(
                        professionalId,
                        end,
                        start
                );
        return blocks.isEmpty();
    }
}
