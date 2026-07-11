package com.turnos.api.services;

import com.turnos.api.business.Business;
import com.turnos.api.business.BusinessRepository;
import com.turnos.api.business.TenantContext;
import com.turnos.api.common.ConflictException;
import com.turnos.api.common.ResourceNotFoundException;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@org.springframework.stereotype.Service
public class ServiceCategoryService {

    private final ServiceCategoryRepository categoryRepository;
    private final ServiceRepository serviceRepository;
    private final BusinessRepository businessRepository;

    public ServiceCategoryService(
            ServiceCategoryRepository categoryRepository,
            ServiceRepository serviceRepository,
            BusinessRepository businessRepository
    ) {
        this.categoryRepository = categoryRepository;
        this.serviceRepository = serviceRepository;
        this.businessRepository = businessRepository;
    }

    @Transactional
    public ServiceCategoryResponse create(ServiceCategoryRequest request) {
        ensureUniqueSlug(request.slug(), null);
        Business business = getActiveBusiness();

        ServiceCategory category = new ServiceCategory(
                business,
                request.name(),
                normalizeSlug(request.slug()),
                request.description(),
                request.displayOrder()
        );
        return ServiceCategoryResponse.from(categoryRepository.save(category));
    }

    @Transactional(readOnly = true)
    public List<ServiceCategoryResponse> findAll() {
        return categoryRepository.findAllByOrderByDisplayOrderAscNameAsc().stream()
                .map(ServiceCategoryResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ServiceCategoryResponse findById(Long id) {
        return ServiceCategoryResponse.from(getCategory(id));
    }

    @Transactional
    public ServiceCategoryResponse update(Long id, ServiceCategoryRequest request) {
        ServiceCategory category = getCategory(id);
        ensureUniqueSlug(request.slug(), id);
        category.updateDetails(
                request.name(),
                normalizeSlug(request.slug()),
                request.description(),
                request.displayOrder()
        );
        return ServiceCategoryResponse.from(category);
    }

    @Transactional
    public ServiceCategoryResponse activate(Long id) {
        ServiceCategory category = getCategory(id);
        category.activate();
        return ServiceCategoryResponse.from(category);
    }

    @Transactional
    public ServiceCategoryResponse deactivate(Long id) {
        ServiceCategory category = getCategory(id);
        if (serviceRepository.existsByCategory_IdAndActiveTrue(id)) {
            throw new ConflictException("Cannot deactivate a category with active services");
        }
        category.deactivate();
        return ServiceCategoryResponse.from(category);
    }

    ServiceCategory getActiveCategory(Long id) {
        ServiceCategory category = getCategory(id);
        if (!category.isActive()) {
            throw new ConflictException("Service category is inactive");
        }
        return category;
    }

    private ServiceCategory getCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ServiceCategory", id));
    }

    private void ensureUniqueSlug(String slug, Long currentId) {
        String normalizedSlug = normalizeSlug(slug);
        boolean exists = currentId == null
                ? categoryRepository.existsBySlugIgnoreCase(normalizedSlug)
                : categoryRepository.existsBySlugIgnoreCaseAndIdNot(normalizedSlug, currentId);

        if (exists) {
            throw new ConflictException("Service category slug already exists");
        }
    }

    private static String normalizeSlug(String slug) {
        return slug == null ? null : slug.trim().toLowerCase();
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
