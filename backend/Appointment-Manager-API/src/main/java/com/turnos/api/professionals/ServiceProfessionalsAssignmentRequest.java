package com.turnos.api.professionals;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record ServiceProfessionalsAssignmentRequest(
        @NotNull
        ServiceProfessionalAssignmentMode mode,

        List<Long> professionalIds
) {
}
