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

    private boolean doesNotOverlapAppointments(LocalDateTime startDateTime, LocalDateTime endDateTime, List<Appointment> appointments) {
        return appointments.stream()
                .noneMatch(appointment -> appointment.overlapsWith(startDateTime, endDateTime));
    }

    private boolean doesNotOverlapBlocks(LocalDateTime startDateTime, LocalDateTime endDateTime, List<AvailabilityBlock> blocks) {
        return blocks.stream()
                .noneMatch(block -> block.blocksRange(startDateTime, endDateTime));
    }
}
