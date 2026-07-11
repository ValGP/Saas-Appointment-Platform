package com.turnos.api.appointments;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long>, JpaSpecificationExecutor<Appointment> {

    List<Appointment> findByProfessionalIdAndStatusInAndStartDateTimeBeforeAndEndDateTimeAfter(
            Long professionalId,
            Collection<AppointmentStatus> statuses,
            LocalDateTime rangeEnd,
            LocalDateTime rangeStart
    );

    List<Appointment> findByClientId(Long clientId);

    List<Appointment> findByProfessionalId(Long professionalId);
}
