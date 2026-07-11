package com.turnos.api.availability;

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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/availability-blocks")
public class AvailabilityBlockController {

    private final AvailabilityBlockService availabilityBlockService;

    public AvailabilityBlockController(AvailabilityBlockService availabilityBlockService) {
        this.availabilityBlockService = availabilityBlockService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public AvailabilityBlockResponse create(@Valid @RequestBody AvailabilityBlockRequest request) {
        return availabilityBlockService.create(request);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<AvailabilityBlockResponse> findAll() {
        return availabilityBlockService.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public AvailabilityBlockResponse findById(@PathVariable Long id) {
        return availabilityBlockService.findById(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public AvailabilityBlockResponse update(@PathVariable Long id, @Valid @RequestBody AvailabilityBlockRequest request) {
        return availabilityBlockService.update(id, request);
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public AvailabilityBlockResponse activate(@PathVariable Long id) {
        return availabilityBlockService.activate(id);
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public AvailabilityBlockResponse deactivate(@PathVariable Long id) {
        return availabilityBlockService.deactivate(id);
    }
}
