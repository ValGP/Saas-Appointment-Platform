package com.turnos.api.services;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ServiceRequest(
        @NotBlank
        @Size(max = 120)
        String name,

        @NotNull
        Long categoryId,

        @Size(max = 500)
        String description,

        @Positive
        int durationMinutes,

        @NotNull
        @DecimalMin(value = "0.00")
        BigDecimal price,

        Boolean onlineBookable,

        Boolean requiresEvaluation
) {
    public boolean effectiveRequiresEvaluation() {
        return Boolean.TRUE.equals(requiresEvaluation);
    }

    public boolean effectiveOnlineBookable() {
        return !effectiveRequiresEvaluation() && !Boolean.FALSE.equals(onlineBookable);
    }
}
