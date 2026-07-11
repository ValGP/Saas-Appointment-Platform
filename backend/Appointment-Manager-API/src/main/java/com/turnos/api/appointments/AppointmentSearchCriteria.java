package com.turnos.api.appointments;

import java.time.LocalDateTime;

public record AppointmentSearchCriteria(
        Long clientId,
        Long professionalId,
        AppointmentStatus status,
        LocalDateTime from,
        LocalDateTime to
) {
}
