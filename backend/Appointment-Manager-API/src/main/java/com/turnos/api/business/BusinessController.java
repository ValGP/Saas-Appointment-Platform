package com.turnos.api.business;

import com.turnos.api.common.ResourceNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/businesses")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class BusinessController {

    private final BusinessRepository businessRepository;

    public BusinessController(BusinessRepository businessRepository) {
        this.businessRepository = businessRepository;
    }

    @GetMapping("/my")
    public ResponseEntity<PublicBusinessResponse> getMyBusiness() {
        Business business = TenantContext.getCurrentTenant();
        if (business == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(PublicBusinessResponse.from(business));
    }

    @PutMapping("/my")
    @Transactional
    public ResponseEntity<PublicBusinessResponse> updateMyBusiness(@Valid @RequestBody BusinessUpdateRequest request) {
        Business businessContext = TenantContext.getCurrentTenant();
        if (businessContext == null) {
            return ResponseEntity.badRequest().build();
        }
        Business business = businessRepository.findById(businessContext.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Business", businessContext.getId()));

        business.updateDetails(
                request.name(),
                business.getSlug(), // Preserve slug
                business.getTimezone(), // Preserve timezone
                request.whatsapp(),
                request.primaryColor(),
                business.getThemePreset(), // Preserve themePreset
                business.getPlanType(), // Preserve planType
                business.getMpAccessToken(), // Preserve MercadoPago Token
                request.showBranding()
        );

        Business saved = businessRepository.save(business);
        return ResponseEntity.ok(PublicBusinessResponse.from(saved));
    }
}
