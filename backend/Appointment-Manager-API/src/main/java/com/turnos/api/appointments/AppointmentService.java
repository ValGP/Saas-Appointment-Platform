package com.turnos.api.appointments;

import com.turnos.api.auth.AuthenticatedUser;
import com.turnos.api.availability.AvailabilityBlockRepository;
import com.turnos.api.availability.BusinessHoursRepository;
import com.turnos.api.business.Business;
import com.turnos.api.business.BusinessRepository;
import com.turnos.api.business.TenantContext;
import com.turnos.api.common.ConflictException;
import com.turnos.api.common.ResourceNotFoundException;
import com.turnos.api.notifications.NotificationService;
import com.turnos.api.professionals.Professional;
import com.turnos.api.professionals.ProfessionalRepository;
import com.turnos.api.professionals.ProfessionalServiceAssignmentService;
import com.turnos.api.services.ServiceRepository;
import com.turnos.api.users.User;
import com.turnos.api.users.UserRepository;
import com.turnos.api.users.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@org.springframework.stereotype.Service
public class AppointmentService {

    private static final List<AppointmentStatus> OCCUPYING_STATUSES = List.of(
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED
    );

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final ProfessionalRepository professionalRepository;
    private final ServiceRepository serviceRepository;
    private final BusinessHoursRepository businessHoursRepository;
    private final AvailabilityBlockRepository availabilityBlockRepository;
    private final BusinessRepository businessRepository;
    private final NotificationService notificationService;
    private final ProfessionalServiceAssignmentService professionalServiceAssignmentService;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            UserRepository userRepository,
            ProfessionalRepository professionalRepository,
            ServiceRepository serviceRepository,
            BusinessHoursRepository businessHoursRepository,
            AvailabilityBlockRepository availabilityBlockRepository,
            BusinessRepository businessRepository,
            NotificationService notificationService,
            ProfessionalServiceAssignmentService professionalServiceAssignmentService
    ) {
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
        this.professionalRepository = professionalRepository;
        this.serviceRepository = serviceRepository;
        this.businessHoursRepository = businessHoursRepository;
        this.availabilityBlockRepository = availabilityBlockRepository;
        this.businessRepository = businessRepository;
        this.notificationService = notificationService;
        this.professionalServiceAssignmentService = professionalServiceAssignmentService;
    }

    @Transactional
    public AppointmentResponse create(AppointmentRequest request, AuthenticatedUser authenticatedUser) {
        User client = resolveClient(request, authenticatedUser);
        Professional professional = getProfessional(request.professionalId());
        com.turnos.api.services.Service service = getService(request.serviceId());
        LocalDateTime endDateTime = service.calculateEndDateTime(request.startDateTime());

        validateClient(client);
        validateProfessional(professional);
        validateService(service, authenticatedUser);
        professionalServiceAssignmentService.ensureProfessionalProvidesService(professional.getId(), service.getId());
        validateAvailability(professional.getId(), request.startDateTime(), endDateTime);

        Business business = getActiveBusiness();

        Appointment appointment = authenticatedUser.getRole() == UserRole.ADMIN
                ? Appointment.createConfirmedByAdmin(business, client, professional, service, request.startDateTime())
                : Appointment.createRequestedByClient(business, client, professional, service, request.startDateTime());
        appointment.updateNotes(request.notes());

        Appointment savedAppointment = appointmentRepository.save(appointment);
        if (authenticatedUser.getRole() == UserRole.ADMIN) {
            notificationService.appointmentCreatedByAdmin(savedAppointment);
        } else {
            notificationService.appointmentRequested(savedAppointment);
        }
        return AppointmentResponse.from(savedAppointment);
    }

    @Transactional
    public AppointmentResponse createPublicAppointment(PublicBookingRequest request) {
        Business business = getActiveBusiness();

        // 1. Resolve or create silent client user
        String email = request.email().trim().toLowerCase();
        User client = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    User newClient = new User(
                            business,
                            request.fullName().trim(),
                            email,
                            "$2a$10$unmatchableDummyHashForSilentUsersDoNotUseThisStringAsRealHash", 
                            request.phone(),
                            UserRole.CLIENT
                    );
                    return userRepository.save(newClient);
                });

        if (client.getRole() != UserRole.CLIENT) {
            throw new ConflictException("User is registered with an admin/professional profile");
        }

        // 2. Load professional and service
        Professional professional = getProfessional(request.professionalId());
        com.turnos.api.services.Service service = getService(request.serviceId());
        LocalDateTime endDateTime = service.calculateEndDateTime(request.startDateTime());

        // 3. Validations
        validateClient(client);
        validateProfessional(professional);
        if (!service.canBeBooked()) {
            throw new ConflictException("Service must be active");
        }
        if (!service.canBeBookedOnline()) {
            throw new ConflictException("Service is not available for online booking");
        }
        professionalServiceAssignmentService.ensureProfessionalProvidesService(professional.getId(), service.getId());
        validateAvailability(professional.getId(), request.startDateTime(), endDateTime);

        // 4. Create appointment
        Appointment appointment = Appointment.createRequestedByClient(business, client, professional, service, request.startDateTime());
        appointment.updateNotes(request.notes());

        Appointment savedAppointment = appointmentRepository.save(appointment);
        notificationService.appointmentRequested(savedAppointment);

        return AppointmentResponse.from(savedAppointment);
    }

    @Transactional(readOnly = true)
    public Page<AppointmentResponse> findAll(AppointmentSearchCriteria criteria, Pageable pageable, AuthenticatedUser authenticatedUser) {
        AppointmentSearchCriteria effectiveCriteria = criteria;
        if (authenticatedUser.getRole() == UserRole.ADMIN) {
            return appointmentRepository.findAll(AppointmentSpecifications.byCriteria(effectiveCriteria), pageable)
                    .map(AppointmentResponse::from);
        }

        effectiveCriteria = new AppointmentSearchCriteria(
                authenticatedUser.getId(),
                criteria.professionalId(),
                criteria.status(),
                criteria.from(),
                criteria.to()
        );

        return appointmentRepository.findAll(AppointmentSpecifications.byCriteria(effectiveCriteria), pageable)
                .map(AppointmentResponse::from);
    }

    @Transactional(readOnly = true)
    public AppointmentResponse findById(Long id, AuthenticatedUser authenticatedUser) {
        Appointment appointment = getAppointment(id);
        ensureCanRead(appointment, authenticatedUser);
        return AppointmentResponse.from(appointment);
    }

    @Transactional
    public AppointmentResponse confirm(Long id) {
        Appointment appointment = getAppointment(id);
        appointment.confirm();
        notificationService.appointmentConfirmed(appointment);
        return AppointmentResponse.from(appointment);
    }

    @Transactional
    public AppointmentResponse reject(Long id, AppointmentTransitionRequest request) {
        Appointment appointment = getAppointment(id);
        appointment.reject(requiredReason(request));
        notificationService.appointmentRejected(appointment);
        return AppointmentResponse.from(appointment);
    }

    @Transactional
    public AppointmentResponse cancelByClient(Long id, AppointmentTransitionRequest request, AuthenticatedUser authenticatedUser) {
        Appointment appointment = getAppointment(id);
        ensureOwnAppointment(appointment, authenticatedUser);
        appointment.cancelByClient(requiredReason(request));
        notificationService.appointmentCanceledByClient(appointment);
        return AppointmentResponse.from(appointment);
    }

    @Transactional
    public AppointmentResponse cancelByAdmin(Long id, AppointmentTransitionRequest request) {
        Appointment appointment = getAppointment(id);
        appointment.cancelByAdmin(requiredReason(request));
        notificationService.appointmentCanceledByAdmin(appointment);
        return AppointmentResponse.from(appointment);
    }

    @Transactional
    public AppointmentResponse complete(Long id) {
        Appointment appointment = getAppointment(id);
        appointment.complete();
        notificationService.appointmentCompleted(appointment);
        return AppointmentResponse.from(appointment);
    }

    @Transactional
    public AppointmentResponse markNoShow(Long id) {
        Appointment appointment = getAppointment(id);
        appointment.markNoShow();
        notificationService.appointmentMarkedNoShow(appointment);
        return AppointmentResponse.from(appointment);
    }

    private User resolveClient(AppointmentRequest request, AuthenticatedUser authenticatedUser) {
        if (authenticatedUser.getRole() == UserRole.CLIENT) {
            return getUser(authenticatedUser.getId());
        }

        if (request.clientId() == null) {
            throw new ConflictException("clientId is required when admin creates an appointment");
        }

        return getUser(request.clientId());
    }

    private void validateClient(User client) {
        if (!client.canRequestAppointments()) {
            throw new ConflictException("Client must be active and have CLIENT role");
        }
    }

    private void validateProfessional(Professional professional) {
        if (!professional.canAttendAppointments()) {
            throw new ConflictException("Professional must be active");
        }
    }

    private void validateService(com.turnos.api.services.Service service, AuthenticatedUser authenticatedUser) {
        if (!service.canBeBooked()) {
            throw new ConflictException("Service must be active and have valid duration");
        }
        if (authenticatedUser.getRole() == UserRole.CLIENT && !service.canBeBookedOnline()) {
            throw new ConflictException("Service is not available for online booking");
        }
    }

    private void validateAvailability(Long professionalId, LocalDateTime startDateTime, LocalDateTime endDateTime) {
        if (!startDateTime.isBefore(endDateTime)) {
            throw new ConflictException("Appointment startDateTime must be before endDateTime");
        }
        if (startDateTime.isBefore(LocalDateTime.now())) {
            throw new ConflictException("Appointment cannot be in the past");
        }

        boolean insideBusinessHours = businessHoursRepository
                .findByProfessionalIdAndDayOfWeekAndActiveTrue(professionalId, startDateTime.getDayOfWeek())
                .stream()
                .anyMatch(hours -> hours.containsRange(startDateTime, endDateTime));
        if (!insideBusinessHours) {
            throw new ConflictException("Appointment must be inside active business hours");
        }

        boolean overlapsAppointment = !appointmentRepository
                .findByProfessionalIdAndStatusInAndStartDateTimeBeforeAndEndDateTimeAfter(
                        professionalId,
                        OCCUPYING_STATUSES,
                        endDateTime,
                        startDateTime
                    )
                .isEmpty();
        if (overlapsAppointment) {
            throw new ConflictException("Appointment overlaps with another pending or confirmed appointment");
        }

        boolean overlapsBlock = !availabilityBlockRepository
                .findByProfessionalIdAndActiveTrueAndStartDateTimeBeforeAndEndDateTimeAfter(
                        professionalId,
                        endDateTime,
                        startDateTime
                )
                .isEmpty();
        if (overlapsBlock) {
            throw new ConflictException("Appointment overlaps with an active availability block");
        }
    }

    private void ensureCanRead(Appointment appointment, AuthenticatedUser authenticatedUser) {
        if (authenticatedUser.getRole() == UserRole.ADMIN) {
            return;
        }
        ensureOwnAppointment(appointment, authenticatedUser);
    }

    private void ensureOwnAppointment(Appointment appointment, AuthenticatedUser authenticatedUser) {
        if (!appointment.getClient().getId().equals(authenticatedUser.getId())) {
            throw new ConflictException("Appointment does not belong to authenticated client");
        }
    }

    private String requiredReason(AppointmentTransitionRequest request) {
        if (request == null || request.reason() == null || request.reason().isBlank()) {
            throw new IllegalArgumentException("reason is required");
        }
        return request.reason();
    }

    private Appointment getAppointment(Long id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
    }

    private User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
    }

    private Professional getProfessional(Long id) {
        return professionalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Professional", id));
    }

    private com.turnos.api.services.Service getService(Long id) {
        return serviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service", id));
    }

    private Business getActiveBusiness() {
        Business business = TenantContext.getCurrentTenant();
        if (business == null) {
            return businessRepository.findById(1L)
                    .orElseThrow(() -> new IllegalStateException("Default business with ID 1 must exist"));
        }
        return business;
    }
}
