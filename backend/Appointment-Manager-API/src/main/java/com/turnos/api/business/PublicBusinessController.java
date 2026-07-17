package com.turnos.api.business;

import com.turnos.api.appointments.AppointmentResponse;
import com.turnos.api.appointments.AppointmentService;
import com.turnos.api.appointments.PublicBookingRequest;
import com.turnos.api.availability.AvailabilityAggregatorService;
import com.turnos.api.availability.AvailabilityService;
import com.turnos.api.availability.AvailabilitySlotResponse;
import com.turnos.api.availability.AvailableSlotResponse;
import com.turnos.api.common.ResourceNotFoundException;
import com.turnos.api.professionals.ProfessionalResponse;
import com.turnos.api.professionals.ProfessionalService;
import com.turnos.api.services.ServiceCatalogService;
import com.turnos.api.services.ServiceCategoryResponse;
import com.turnos.api.services.ServiceCategoryService;
import com.turnos.api.services.ServiceResponse;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/public")
public class PublicBusinessController {

    private final BusinessRepository businessRepository;
    private final ServiceCatalogService serviceCatalogService;
    private final ServiceCategoryService serviceCategoryService;
    private final ProfessionalService professionalService;
    private final AvailabilityService availabilityService;
    private final AvailabilityAggregatorService availabilityAggregatorService;
    private final AppointmentService appointmentService;

    public PublicBusinessController(
            BusinessRepository businessRepository,
            ServiceCatalogService serviceCatalogService,
            ServiceCategoryService serviceCategoryService,
            ProfessionalService professionalService,
            AvailabilityService availabilityService,
            AvailabilityAggregatorService availabilityAggregatorService,
            AppointmentService appointmentService
    ) {
        this.businessRepository = businessRepository;
        this.serviceCatalogService = serviceCatalogService;
        this.serviceCategoryService = serviceCategoryService;
        this.professionalService = professionalService;
        this.availabilityService = availabilityService;
        this.availabilityAggregatorService = availabilityAggregatorService;
        this.appointmentService = appointmentService;
    }

    @GetMapping("/businesses/{slug}")
    public ResponseEntity<PublicBusinessResponse> getPublicConfig(@PathVariable String slug) {
        Business business = businessRepository.findBySlugIgnoreCase(slug)
                .filter(Business::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Business", slug));
        return ResponseEntity.ok(PublicBusinessResponse.from(business));
    }

    @GetMapping("/services")
    public List<ServiceResponse> findServices(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "true") boolean onlineBookableOnly
    ) {
        return serviceCatalogService.findAll(categoryId, onlineBookableOnly);
    }

    @GetMapping("/service-categories")
    public List<ServiceCategoryResponse> findServiceCategories() {
        return serviceCategoryService.findAll();
    }

    @GetMapping("/professionals")
    public List<ProfessionalResponse> findProfessionals() {
        return professionalService.findAll();
    }

    /**
     * @deprecated Use {@link #getAvailableSlots} instead.
     *             Kept for backward compatibility with existing frontend consumers.
     */
    @Deprecated
    @GetMapping("/availability")
    public List<AvailabilitySlotResponse> getAvailability(
            @RequestParam Long professionalId,
            @RequestParam Long serviceId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return availabilityService.getAvailability(professionalId, serviceId, date);
    }

    /**
     * Returns available booking slots for a service on a given date.
     *
     * <p>When {@code professionalId} is omitted, the system automatically merges
     * availability across all active professionals assigned to the service and
     * returns a unified slot list enriched with {@code availableProfessionalsCount}.</p>
     *
     * <p>When {@code professionalId} is provided, only that professional's schedule
     * is consulted and {@code availableProfessionalsCount} is {@code null}.</p>
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

    @PostMapping("/appointments")
    @ResponseStatus(HttpStatus.CREATED)
    public AppointmentResponse createPublicAppointment(@Valid @RequestBody PublicBookingRequest request) {
        return appointmentService.createPublicAppointment(request);
    }
}
