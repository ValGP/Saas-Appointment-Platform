package com.turnos.api.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateCurrentUserRequest(
        @NotBlank
        @Size(max = 120)
        String fullName,

        @Size(max = 40)
        String phone
) {
}
