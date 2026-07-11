package com.turnos.api.professionals;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
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
@RequestMapping("/api/professionals")
public class ProfessionalController {

    private final ProfessionalService professionalService;
    private final ProfessionalServiceAssignmentService professionalServiceAssignmentService;

    public ProfessionalController(
            ProfessionalService professionalService,
            ProfessionalServiceAssignmentService professionalServiceAssignmentService
    ) {
        this.professionalService = professionalService;
        this.professionalServiceAssignmentService = professionalServiceAssignmentService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public ProfessionalResponse create(@Valid @RequestBody ProfessionalRequest request) {
        return professionalService.create(request);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CLIENT')")
    public List<ProfessionalResponse> findAll(
            @RequestParam(required = false) Long serviceId,
            @RequestParam(required = false, defaultValue = "false") boolean hasAvailability
    ) {
        if (serviceId != null) {
            List<ProfessionalResponse> professionals = professionalServiceAssignmentService.findProfessionalsForService(serviceId).stream()
                    .map(ProfessionalResponse::from)
                    .toList();
            if (hasAvailability) {
                return professionals.stream()
                        .filter(p -> professionalServiceAssignmentService.hasBusinessHours(p.id()))
                        .toList();
            }
            return professionals;
        }

        return professionalService.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CLIENT')")
    public ProfessionalResponse findById(@PathVariable Long id) {
        return professionalService.findById(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ProfessionalResponse update(@PathVariable Long id, @Valid @RequestBody ProfessionalRequest request) {
        return professionalService.update(id, request);
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ProfessionalResponse activate(@PathVariable Long id) {
        return professionalService.activate(id);
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ProfessionalResponse deactivate(@PathVariable Long id) {
        return professionalService.deactivate(id);
    }

    @GetMapping("/{id}/services")
    @PreAuthorize("hasRole('ADMIN')")
    public ProfessionalServicesAssignmentResponse findServicesAssignment(@PathVariable Long id) {
        return professionalServiceAssignmentService.findServicesAssignmentForProfessional(id);
    }

    @PutMapping("/{id}/services")
    @PreAuthorize("hasRole('ADMIN')")
    public ProfessionalServicesAssignmentResponse assignServices(
            @PathVariable Long id,
            @Valid @RequestBody ProfessionalServicesAssignmentRequest request
    ) {
        return professionalServiceAssignmentService.assignServicesToProfessional(id, request);
    }
}
