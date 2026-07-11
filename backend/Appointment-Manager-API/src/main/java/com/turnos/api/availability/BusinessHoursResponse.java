package com.turnos.api.availability;

import java.time.DayOfWeek;
import java.time.LocalTime;

public record BusinessHoursResponse(
        Long id,
        Long professionalId,
        String professionalName,
        DayOfWeek dayOfWeek,
        LocalTime startTime,
        LocalTime endTime,
        boolean active
) {
    static BusinessHoursResponse from(BusinessHours businessHours) {
        return new BusinessHoursResponse(
                businessHours.getId(),
                businessHours.getProfessional().getId(),
                businessHours.getProfessional().getFullName(),
                businessHours.getDayOfWeek(),
                businessHours.getStartTime(),
                businessHours.getEndTime(),
                businessHours.isActive()
        );
    }
}
