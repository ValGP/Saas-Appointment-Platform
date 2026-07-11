package com.turnos.api.availability;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record AvailabilityBlockRequest(
        @NotNull
        Long professionalId,

        @NotNull
        LocalDateTime startDateTime,

        @NotNull
        LocalDateTime endDateTime,

        @Size(max = 300)
        String reason,

        @NotNull
        AvailabilityBlockType type
) {
}
