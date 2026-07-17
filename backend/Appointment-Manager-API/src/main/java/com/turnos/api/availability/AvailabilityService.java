package com.turnos.api.availability;

import com.turnos.api.appointments.Appointment;
import com.turnos.api.appointments.AppointmentRepository;
import com.turnos.api.appointments.AppointmentStatus;
import com.turnos.api.common.ConflictException;
import com.turnos.api.common.ResourceNotFoundException;
import com.turnos.api.professionals.Professional;
import com.turnos.api.professionals.ProfessionalRepository;
import com.turnos.api.professionals.ProfessionalServiceAssignmentService;
import com.turnos.api.services.ServiceRepository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@org.springframework.stereotype.Service
public class AvailabilityService {

    private static final List<AppointmentStatus> OCCUPYING_STATUSES = List.of(
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED
    );

    private final ProfessionalRepository professionalRepository;
    private final ServiceRepository serviceRepository;
    private final BusinessHoursRepository businessHoursRepository;
    private final AppointmentRepository appointmentRepository;
    private final AvailabilityBlockRepository availabilityBlockRepository;
    private final ProfessionalServiceAssignmentService professionalServiceAssignmentService;

    public AvailabilityService(
            ProfessionalRepository professionalRepository,
            ServiceRepository serviceRepository,
            BusinessHoursRepository businessHoursRepository,
            AppointmentRepository appointmentRepository,
            AvailabilityBlockRepository availabilityBlockRepository,
            ProfessionalServiceAssignmentService professionalServiceAssignmentService
    ) {
        this.professionalRepository = professionalRepository;
        this.serviceRepository = serviceRepository;
        this.businessHoursRepository = businessHoursRepository;
        this.appointmentRepository = appointmentRepository;
        this.availabilityBlockRepository = availabilityBlockRepository;
        this.professionalServiceAssignmentService = professionalServiceAssignmentService;
    }

    /**
     * Loads professional and service by their IDs, validates preconditions,
     * then delegates to {@link #getAvailabilityForProfessional}.
     *
     * <p>This is the entry point for single-professional availability queries
     * made by authenticated controllers.</p>
     */
    @Transactional(readOnly = true)
    public List<AvailabilitySlotResponse> getAvailability(Long professionalId, Long serviceId, LocalDate date) {
        Professional professional = professionalRepository.findById(professionalId)
                .orElseThrow(() -> new ResourceNotFoundException("Professional", professionalId));
        com.turnos.api.services.Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Service", serviceId));

        if (!professional.canAttendAppointments()) {
            throw new ConflictException("Professional must be active");
        }
        if (!service.canBeBooked()) {
            throw new ConflictException("Service must be active and have valid duration");
        }
        if (!professionalServiceAssignmentService.canProfessionalProvideService(professionalId, serviceId)) {
            return List.of();
        }

        return getAvailabilityForProfessional(professional, service, date);
    }

    /**
     * Calculates available slots for a single professional on a given date.
     *
     * <p>This method assumes all preconditions (professional active, service bookable,
     * assignment validated) have already been checked by the caller.
     * It is designed to be called in bulk by {@code AvailabilityAggregatorService}
     * without repeating entity-loading or validation overhead per professional.</p>
     *
     * <p>Algorithm:</p>
     * <ol>
     *   <li>Load appointments that overlap the requested day (PENDING or CONFIRMED).</li>
     *   <li>Load active availability blocks that overlap the requested day.</li>
     *   <li>Iterate over each active business-hours window for that day of the week.</li>
     *   <li>Generate candidate slots of {@code service.durationMinutes} length.</li>
     *   <li>Keep only slots that are in the future, do not overlap appointments,
     *       and do not overlap blocks.</li>
     *   <li>Return the list sorted chronologically.</li>
     * </ol>
     *
     * @param professional the professional whose schedule to evaluate (must be active)
     * @param service      the service to be rendered (must be bookable)
     * @param date         the calendar date to query
     * @return sorted list of available slots; empty if none found
     */
    @Transactional(readOnly = true)
    public List<AvailabilitySlotResponse> getAvailabilityForProfessional(
            Professional professional,
            com.turnos.api.services.Service service,
            LocalDate date
    ) {
        Long professionalId = professional.getId();

        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();

        List<Appointment> appointments = appointmentRepository
                .findByProfessionalIdAndStatusInAndStartDateTimeBeforeAndEndDateTimeAfter(
                        professionalId,
                        OCCUPYING_STATUSES,
                        dayEnd,
                        dayStart
                );
        List<AvailabilityBlock> blocks = availabilityBlockRepository
                .findByProfessionalIdAndActiveTrueAndStartDateTimeBeforeAndEndDateTimeAfter(
                        professionalId,
                        dayEnd,
                        dayStart
                );

        LocalDateTime now = LocalDateTime.now();
        List<AvailabilitySlotResponse> slots = new ArrayList<>();
        int durationMinutes = service.getDurationMinutes();

        businessHoursRepository.findByProfessionalIdAndDayOfWeekAndActiveTrue(professionalId, date.getDayOfWeek())
                .forEach(hours -> {
                    LocalDateTime candidateStart = LocalDateTime.of(date, hours.getStartTime());
                    LocalDateTime limit = LocalDateTime.of(date, hours.getEndTime());

                    while (!candidateStart.plusMinutes(durationMinutes).isAfter(limit)) {
                        LocalDateTime candidateEnd = candidateStart.plusMinutes(durationMinutes);
                        if (!candidateStart.isBefore(now)
                                && doesNotOverlapAppointments(candidateStart, candidateEnd, appointments)
                                && doesNotOverlapBlocks(candidateStart, candidateEnd, blocks)) {
                            slots.add(new AvailabilitySlotResponse(candidateStart, candidateEnd));
                        }
                        candidateStart = candidateStart.plusMinutes(durationMinutes);
                    }
                });

        return slots.stream()
                .sorted(Comparator.comparing(AvailabilitySlotResponse::startDateTime))
                .toList();
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private boolean doesNotOverlapAppointments(LocalDateTime startDateTime, LocalDateTime endDateTime, List<Appointment> appointments) {
        return appointments.stream()
                .noneMatch(appointment -> appointment.overlapsWith(startDateTime, endDateTime));
    }

    private boolean doesNotOverlapBlocks(LocalDateTime startDateTime, LocalDateTime endDateTime, List<AvailabilityBlock> blocks) {
        return blocks.stream()
                .noneMatch(block -> block.blocksRange(startDateTime, endDateTime));
    }
}
