package com.turnos.api.business;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BusinessUpdateRequest(
        @NotBlank
        @Size(max = 120)
        String name,

        @Size(max = 40)
        String whatsapp,

        @Size(max = 20)
        String primaryColor,

        boolean showBranding
) {}
