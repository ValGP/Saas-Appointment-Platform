package com.turnos.api.appointments;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record AppointmentRequest(
        Long clientId,

        Long professionalId,

        @NotNull
        Long serviceId,

        @NotNull
        LocalDateTime startDateTime,

        @Size(max = 500)
        String notes
) {
}
