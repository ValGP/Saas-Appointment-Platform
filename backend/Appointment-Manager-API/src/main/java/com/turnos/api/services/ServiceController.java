package com.turnos.api.services;

import jakarta.validation.Valid;
import com.turnos.api.professionals.ProfessionalServiceAssignmentService;
import com.turnos.api.professionals.ServiceProfessionalsAssignmentRequest;
import com.turnos.api.professionals.ServiceProfessionalsAssignmentResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/services")
public class ServiceController {

    private final ServiceCatalogService serviceCatalogService;
    private final ProfessionalServiceAssignmentService professionalServiceAssignmentService;

    public ServiceController(
            ServiceCatalogService serviceCatalogService,
            ProfessionalServiceAssignmentService professionalServiceAssignmentService
    ) {
        this.serviceCatalogService = serviceCatalogService;
        this.professionalServiceAssignmentService = professionalServiceAssignmentService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public ServiceResponse create(@Valid @RequestBody ServiceRequest request) {
        return serviceCatalogService.create(request);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CLIENT')")
    @Transactional(readOnly = true)
    public List<ServiceResponse> findAll(
            @RequestParam(required = false) Long professionalId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "false") boolean onlineBookableOnly
    ) {
        if (professionalId != null) {
            return professionalServiceAssignmentService.findServicesForProfessional(professionalId).stream()
                    .filter(service -> categoryId == null
                            || (service.getCategory() != null && categoryId.equals(service.getCategory().getId())))
                    .filter(service -> !onlineBookableOnly || service.canBeBookedOnline())
                    .map(ServiceResponse::from)
                    .toList();
        }

        return serviceCatalogService.findAll(categoryId, onlineBookableOnly);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CLIENT')")
    public ServiceResponse findById(@PathVariable Long id) {
        return serviceCatalogService.findById(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ServiceResponse update(@PathVariable Long id, @Valid @RequestBody ServiceRequest request) {
        return serviceCatalogService.update(id, request);
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ServiceResponse activate(@PathVariable Long id) {
        return serviceCatalogService.activate(id);
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ServiceResponse deactivate(@PathVariable Long id) {
        return serviceCatalogService.deactivate(id);
    }

    @GetMapping("/{id}/professionals")
    @PreAuthorize("hasRole('ADMIN')")
    public ServiceProfessionalsAssignmentResponse findProfessionalsAssignment(@PathVariable Long id) {
        return professionalServiceAssignmentService.findProfessionalsAssignmentForService(id);
    }

    @PutMapping("/{id}/professionals")
    @PreAuthorize("hasRole('ADMIN')")
    public ServiceProfessionalsAssignmentResponse assignProfessionals(
            @PathVariable Long id,
            @Valid @RequestBody ServiceProfessionalsAssignmentRequest request
    ) {
        return professionalServiceAssignmentService.assignProfessionalsToService(id, request);
    }
}
