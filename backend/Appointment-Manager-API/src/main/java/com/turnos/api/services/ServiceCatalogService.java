package com.turnos.api.services;

import com.turnos.api.business.Business;
import com.turnos.api.business.BusinessRepository;
import com.turnos.api.business.TenantContext;
import com.turnos.api.common.ResourceNotFoundException;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@org.springframework.stereotype.Service
public class ServiceCatalogService {

    private final ServiceRepository serviceRepository;
    private final ServiceCategoryService categoryService;
    private final BusinessRepository businessRepository;

    public ServiceCatalogService(ServiceRepository serviceRepository, ServiceCategoryService categoryService, BusinessRepository businessRepository) {
        this.serviceRepository = serviceRepository;
        this.categoryService = categoryService;
        this.businessRepository = businessRepository;
    }

    @Transactional
    public ServiceResponse create(ServiceRequest request) {
        ServiceCategory category = categoryService.getActiveCategory(request.categoryId());
        Business business = getActiveBusiness();

        Service service = new Service(
                business,
                request.name(),
                request.description(),
                request.durationMinutes(),
                request.price(),
                category,
                request.effectiveOnlineBookable(),
                request.effectiveRequiresEvaluation()
        );

        return ServiceResponse.from(serviceRepository.save(service));
    }

    @Transactional(readOnly = true)
    public List<ServiceResponse> findAll(Long categoryId, boolean onlineBookableOnly) {
        List<Service> services = categoryId == null
                ? serviceRepository.findAll()
                : serviceRepository.findByCategory_Id(categoryId);

        return services.stream()
                .filter(service -> !onlineBookableOnly || service.canBeBookedOnline())
                .map(ServiceResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ServiceResponse findById(Long id) {
        return ServiceResponse.from(getService(id));
    }

    @Transactional
    public ServiceResponse update(Long id, ServiceRequest request) {
        Service service = getService(id);
        ServiceCategory category = categoryService.getActiveCategory(request.categoryId());
        service.updateDetails(
                request.name(),
                request.description(),
                request.durationMinutes(),
                request.price(),
                category,
                request.effectiveOnlineBookable(),
                request.effectiveRequiresEvaluation()
        );
        return ServiceResponse.from(service);
    }

    @Transactional
    public ServiceResponse activate(Long id) {
        Service service = getService(id);
        service.activate();
        return ServiceResponse.from(service);
    }

    @Transactional
    public ServiceResponse deactivate(Long id) {
        Service service = getService(id);
        service.deactivate();
        return ServiceResponse.from(service);
    }

    private Service getService(Long id) {
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
