package com.turnos.api.appointments;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record PublicBookingRequest(
        @NotNull(message = "serviceId is required")
        Long serviceId,

        Long professionalId,

        @NotNull(message = "startDateTime is required")
        LocalDateTime startDateTime,

        @NotBlank(message = "fullName is required")
        String fullName,

        @NotBlank(message = "email is required")
        @Email(message = "Invalid email format")
        String email,

        String phone,
        String notes
) {
}
