package com.turnos.api.availability;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.DayOfWeek;
import java.util.List;

public interface BusinessHoursRepository extends JpaRepository<BusinessHours, Long> {

    List<BusinessHours> findByProfessionalIdAndDayOfWeekAndActiveTrue(Long professionalId, DayOfWeek dayOfWeek);

    boolean existsByProfessionalIdAndActiveTrue(Long professionalId);
}
