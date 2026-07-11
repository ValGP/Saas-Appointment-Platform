package com.turnos.api.availability;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface AvailabilityBlockRepository extends JpaRepository<AvailabilityBlock, Long> {

    List<AvailabilityBlock> findByProfessionalIdAndActiveTrueAndStartDateTimeBeforeAndEndDateTimeAfter(
            Long professionalId,
            LocalDateTime rangeEnd,
            LocalDateTime rangeStart
    );
}
