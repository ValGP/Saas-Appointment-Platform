package com.turnos.api.availability;

import com.turnos.api.appointments.AppointmentRepository;
import com.turnos.api.appointments.AppointmentStatus;
import com.turnos.api.business.Business;
import com.turnos.api.business.BusinessRepository;
import com.turnos.api.business.TenantContext;
import com.turnos.api.common.ConflictException;
import com.turnos.api.common.ResourceNotFoundException;
import com.turnos.api.professionals.Professional;
import com.turnos.api.professionals.ProfessionalRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@org.springframework.stereotype.Service
public class AvailabilityBlockService {

    private static final List<AppointmentStatus> OCCUPYING_STATUSES = List.of(
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED
    );

    private final AvailabilityBlockRepository availabilityBlockRepository;
    private final ProfessionalRepository professionalRepository;
    private final AppointmentRepository appointmentRepository;
    private final BusinessRepository businessRepository;

    public AvailabilityBlockService(
            AvailabilityBlockRepository availabilityBlockRepository,
            ProfessionalRepository professionalRepository,
            AppointmentRepository appointmentRepository,
            BusinessRepository businessRepository
    ) {
        this.availabilityBlockRepository = availabilityBlockRepository;
        this.professionalRepository = professionalRepository;
        this.appointmentRepository = appointmentRepository;
        this.businessRepository = businessRepository;
    }

    @Transactional
    public AvailabilityBlockResponse create(AvailabilityBlockRequest request) {
        validateRange(request);
        Professional professional = getProfessional(request.professionalId());
        ensureNoActiveAppointmentOverlap(request);

        Business business = getActiveBusiness();

        AvailabilityBlock block = new AvailabilityBlock(
                business,
                professional,
                request.startDateTime(),
                request.endDateTime(),
                request.reason(),
                request.type()
        );

        return AvailabilityBlockResponse.from(availabilityBlockRepository.save(block));
    }

    @Transactional(readOnly = true)
    public List<AvailabilityBlockResponse> findAll() {
        return availabilityBlockRepository.findAll().stream()
                .map(AvailabilityBlockResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public AvailabilityBlockResponse findById(Long id) {
        return AvailabilityBlockResponse.from(getAvailabilityBlock(id));
    }

    @Transactional
    public AvailabilityBlockResponse update(Long id, AvailabilityBlockRequest request) {
        validateRange(request);
        Professional professional = getProfessional(request.professionalId());
        AvailabilityBlock block = getAvailabilityBlock(id);
        if (block.isActive()) {
            ensureNoActiveAppointmentOverlap(request);
        }

        block.updateBlock(professional, request.startDateTime(), request.endDateTime(), request.reason(), request.type());
        return AvailabilityBlockResponse.from(block);
    }

    @Transactional
    public AvailabilityBlockResponse activate(Long id) {
        AvailabilityBlock block = getAvailabilityBlock(id);
        AvailabilityBlockRequest request = new AvailabilityBlockRequest(
                block.getProfessional().getId(),
                block.getStartDateTime(),
                block.getEndDateTime(),
                block.getReason(),
                block.getType()
        );
        ensureNoActiveAppointmentOverlap(request);
        block.activate();
        return AvailabilityBlockResponse.from(block);
    }

    @Transactional
    public AvailabilityBlockResponse deactivate(Long id) {
        AvailabilityBlock block = getAvailabilityBlock(id);
        block.deactivate();
        return AvailabilityBlockResponse.from(block);
    }

    private void validateRange(AvailabilityBlockRequest request) {
        if (!request.startDateTime().isBefore(request.endDateTime())) {
            throw new ConflictException("Availability block startDateTime must be before endDateTime");
        }
    }

    private void ensureNoActiveAppointmentOverlap(AvailabilityBlockRequest request) {
        boolean hasOverlap = !appointmentRepository
                .findByProfessionalIdAndStatusInAndStartDateTimeBeforeAndEndDateTimeAfter(
                        request.professionalId(),
                        OCCUPYING_STATUSES,
                        request.endDateTime(),
                        request.startDateTime()
                )
                .isEmpty();

        if (hasOverlap) {
            throw new ConflictException("Availability block overlaps with pending or confirmed appointments");
        }
    }

    private AvailabilityBlock getAvailabilityBlock(Long id) {
        return availabilityBlockRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AvailabilityBlock", id));
    }

    private Professional getProfessional(Long id) {
        return professionalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Professional", id));
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
