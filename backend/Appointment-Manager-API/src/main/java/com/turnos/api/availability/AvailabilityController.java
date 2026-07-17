package com.turnos.api.availability;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/availability")
public class AvailabilityController {

    private final AvailabilityService availabilityService;
    private final AvailabilityAggregatorService availabilityAggregatorService;

    public AvailabilityController(
            AvailabilityService availabilityService,
            AvailabilityAggregatorService availabilityAggregatorService
    ) {
        this.availabilityService = availabilityService;
        this.availabilityAggregatorService = availabilityAggregatorService;
    }

    /**
     * @deprecated Use {@link #getAvailableSlots} instead.
     *             Kept for backward compatibility with existing admin frontend consumers.
     */
    @Deprecated
    @GetMapping
    public List<AvailabilitySlotResponse> getAvailability(
            @RequestParam Long professionalId,
            @RequestParam Long serviceId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return availabilityService.getAvailability(professionalId, serviceId, date);
    }

    /**
     * Authenticated equivalent of {@code GET /api/public/available-slots}.
     *
     * <p>Returns available booking slots for a service on a given date.
     * When {@code professionalId} is omitted the system merges availability
     * across all active professionals assigned to the service.</p>
     *
     * @param serviceId      required; the service to be rendered
     * @param date           required; the calendar date (ISO-8601)
     * @param professionalId optional; omit for "any available" mode
     */
    @GetMapping("/available-slots")
    public List<AvailableSlotResponse> getAvailableSlots(
            @RequestParam Long serviceId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long professionalId
    ) {
        return availabilityAggregatorService.getAvailableSlots(serviceId, date, professionalId);
    }
}
