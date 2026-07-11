package com.turnos.api.availability;

import com.turnos.api.professionals.Professional;
import com.turnos.api.services.Service;
import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;

class BusinessHoursTest {

    @Test
    void validatesRangeAndDayContainment() {
        BusinessHours hours = new BusinessHours(
                new Professional("Professional", "pro@email.com", "123"),
                DayOfWeek.MONDAY,
                LocalTime.of(9, 0),
                LocalTime.of(13, 0)
        );

        assertThat(hours.hasValidRange()).isTrue();
        assertThat(hours.belongsToDay(LocalDate.of(2027, 5, 24))).isTrue();
        assertThat(hours.containsRange(
                LocalDateTime.of(2027, 5, 24, 10, 0),
                LocalDateTime.of(2027, 5, 24, 11, 0)
        )).isTrue();
        assertThat(hours.containsRange(
                LocalDateTime.of(2027, 5, 24, 12, 30),
                LocalDateTime.of(2027, 5, 24, 13, 30)
        )).isFalse();
    }

    @Test
    void detectsOverlapsAndServiceFit() {
        BusinessHours hours = new BusinessHours(
                new Professional("Professional", "pro@email.com", "123"),
                DayOfWeek.MONDAY,
                LocalTime.of(9, 0),
                LocalTime.of(13, 0)
        );
        Service service = new Service("Session", null, 60, null);

        assertThat(hours.overlapsWith(LocalTime.of(12, 0), LocalTime.of(14, 0))).isTrue();
        assertThat(hours.overlapsWith(LocalTime.of(13, 0), LocalTime.of(14, 0))).isFalse();
        assertThat(hours.canContainService(LocalDateTime.of(2027, 5, 24, 12, 0), service)).isTrue();
        assertThat(hours.canContainService(LocalDateTime.of(2027, 5, 24, 12, 30), service)).isFalse();
    }
}
