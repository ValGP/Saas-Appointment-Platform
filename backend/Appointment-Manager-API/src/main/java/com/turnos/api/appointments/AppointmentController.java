package com.turnos.api.appointments;

import com.turnos.api.auth.AuthenticatedUser;
import com.turnos.api.common.PageResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AppointmentResponse create(
            @Valid @RequestBody AppointmentRequest request,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return appointmentService.create(request, authenticatedUser);
    }

    @GetMapping
    public PageResponse<AppointmentResponse> findAll(
            @RequestParam(required = false) Long clientId,
            @RequestParam(required = false) Long professionalId,
            @RequestParam(required = false) AppointmentStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            Pageable pageable,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        AppointmentSearchCriteria criteria = new AppointmentSearchCriteria(clientId, professionalId, status, from, to);
        return PageResponse.from(appointmentService.findAll(criteria, pageable, authenticatedUser));
    }

    @GetMapping("/{id}")
    public AppointmentResponse findById(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser authenticatedUser) {
        return appointmentService.findById(id, authenticatedUser);
    }

    @PatchMapping("/{id}/confirm")
    @PreAuthorize("hasRole('ADMIN')")
    public AppointmentResponse confirm(@PathVariable Long id) {
        return appointmentService.confirm(id);
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public AppointmentResponse reject(@PathVariable Long id, @Valid @RequestBody AppointmentTransitionRequest request) {
        return appointmentService.reject(id, request);
    }

    @PatchMapping("/{id}/cancel-by-client")
    @PreAuthorize("hasRole('CLIENT')")
    public AppointmentResponse cancelByClient(
            @PathVariable Long id,
            @Valid @RequestBody AppointmentTransitionRequest request,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return appointmentService.cancelByClient(id, request, authenticatedUser);
    }

    @PatchMapping("/{id}/cancel-by-admin")
    @PreAuthorize("hasRole('ADMIN')")
    public AppointmentResponse cancelByAdmin(@PathVariable Long id, @Valid @RequestBody AppointmentTransitionRequest request) {
        return appointmentService.cancelByAdmin(id, request);
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasRole('ADMIN')")
    public AppointmentResponse complete(@PathVariable Long id) {
        return appointmentService.complete(id);
    }

    @PatchMapping("/{id}/no-show")
    @PreAuthorize("hasRole('ADMIN')")
    public AppointmentResponse markNoShow(@PathVariable Long id) {
        return appointmentService.markNoShow(id);
    }
}
