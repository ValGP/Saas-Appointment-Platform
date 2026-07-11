package com.turnos.api.availability;

import java.time.LocalDateTime;

public record AvailabilitySlotResponse(
        LocalDateTime startDateTime,
        LocalDateTime endDateTime
) {
}
