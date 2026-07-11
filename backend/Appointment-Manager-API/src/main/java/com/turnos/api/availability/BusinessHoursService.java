package com.turnos.api.availability;

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
public class BusinessHoursService {

    private final BusinessHoursRepository businessHoursRepository;
    private final ProfessionalRepository professionalRepository;
    private final BusinessRepository businessRepository;

    public BusinessHoursService(BusinessHoursRepository businessHoursRepository, ProfessionalRepository professionalRepository, BusinessRepository businessRepository) {
        this.businessHoursRepository = businessHoursRepository;
        this.professionalRepository = professionalRepository;
        this.businessRepository = businessRepository;
    }

    @Transactional
    public BusinessHoursResponse create(BusinessHoursRequest request) {
        validateRange(request);
        Professional professional = getProfessional(request.professionalId());
        ensureNoActiveOverlap(null, request);

        Business business = getActiveBusiness();

        BusinessHours businessHours = new BusinessHours(
                business,
                professional,
                request.dayOfWeek(),
                request.startTime(),
                request.endTime()
        );

        return BusinessHoursResponse.from(businessHoursRepository.save(businessHours));
    }

    @Transactional(readOnly = true)
    public List<BusinessHoursResponse> findAll() {
        return businessHoursRepository.findAll().stream()
                .map(BusinessHoursResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public BusinessHoursResponse findById(Long id) {
        return BusinessHoursResponse.from(getBusinessHours(id));
    }

    @Transactional
    public BusinessHoursResponse update(Long id, BusinessHoursRequest request) {
        validateRange(request);
        Professional professional = getProfessional(request.professionalId());
        BusinessHours businessHours = getBusinessHours(id);
        ensureNoActiveOverlap(id, request);

        businessHours.updateHours(professional, request.dayOfWeek(), request.startTime(), request.endTime());
        return BusinessHoursResponse.from(businessHours);
    }

    @Transactional
    public BusinessHoursResponse activate(Long id) {
        BusinessHours businessHours = getBusinessHours(id);
        BusinessHoursRequest request = new BusinessHoursRequest(
                businessHours.getProfessional().getId(),
                businessHours.getDayOfWeek(),
                businessHours.getStartTime(),
                businessHours.getEndTime()
        );
        ensureNoActiveOverlap(id, request);
        businessHours.activate();
        return BusinessHoursResponse.from(businessHours);
    }

    @Transactional
    public BusinessHoursResponse deactivate(Long id) {
        BusinessHours businessHours = getBusinessHours(id);
        businessHours.deactivate();
        return BusinessHoursResponse.from(businessHours);
    }

    private void validateRange(BusinessHoursRequest request) {
        if (!request.startTime().isBefore(request.endTime())) {
            throw new ConflictException("Business hours startTime must be before endTime");
        }
    }

    private void ensureNoActiveOverlap(Long currentId, BusinessHoursRequest request) {
        boolean hasOverlap = businessHoursRepository
                .findByProfessionalIdAndDayOfWeekAndActiveTrue(request.professionalId(), request.dayOfWeek())
                .stream()
                .filter(existing -> currentId == null || !existing.getId().equals(currentId))
                .anyMatch(existing -> existing.overlapsWith(request.startTime(), request.endTime()));

        if (hasOverlap) {
            throw new ConflictException("Active business hours overlap for the same professional and day");
        }
    }

    private BusinessHours getBusinessHours(Long id) {
        return businessHoursRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BusinessHours", id));
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
