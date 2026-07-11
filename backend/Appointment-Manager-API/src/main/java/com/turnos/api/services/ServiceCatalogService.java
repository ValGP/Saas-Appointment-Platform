package com.turnos.api.services;

import com.turnos.api.common.ResourceNotFoundException;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@org.springframework.stereotype.Service
public class ServiceCatalogService {

    private final ServiceRepository serviceRepository;
    private final ServiceCategoryService categoryService;

    public ServiceCatalogService(ServiceRepository serviceRepository, ServiceCategoryService categoryService) {
        this.serviceRepository = serviceRepository;
        this.categoryService = categoryService;
    }

    @Transactional
    public ServiceResponse create(ServiceRequest request) {
        ServiceCategory category = categoryService.getActiveCategory(request.categoryId());
        Service service = new Service(
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
}
