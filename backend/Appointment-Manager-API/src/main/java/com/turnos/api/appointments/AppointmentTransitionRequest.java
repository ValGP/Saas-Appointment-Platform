package com.turnos.api.appointments;

import jakarta.validation.constraints.Size;

public record AppointmentTransitionRequest(
        @Size(max = 300)
        String reason
) {
}
