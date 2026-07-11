package com.turnos.api.services;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ServiceCategoryRequest(
        @NotBlank
        @Size(max = 120)
        String name,

        @NotBlank
        @Size(max = 140)
        String slug,

        @Size(max = 500)
        String description,

        @Min(0)
        int displayOrder
) {
}
