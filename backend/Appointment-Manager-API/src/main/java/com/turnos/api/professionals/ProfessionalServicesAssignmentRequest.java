package com.turnos.api.professionals;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record ProfessionalServicesAssignmentRequest(
        @NotNull
        ServiceAssignmentMode mode,

        List<Long> serviceIds
) {
}
