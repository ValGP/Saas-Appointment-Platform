package com.turnos.api.appointments;

import java.time.LocalDateTime;
import java.util.UUID;

public record AppointmentResponse(
        Long id,
        UUID publicUuid,
        Long clientId,
        String clientName,
        Long professionalId,
        String professionalName,
        Long serviceId,
        String serviceName,
        LocalDateTime startDateTime,
        LocalDateTime endDateTime,
        AppointmentStatus status,
        String notes,
        String cancelReason,
        String rejectionReason,
        CreatedByRole createdByRole,
        LocalDateTime confirmedAt,
        LocalDateTime canceledAt,
        LocalDateTime completedAt,
        LocalDateTime noShowAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static AppointmentResponse from(Appointment appointment) {
        return new AppointmentResponse(
                appointment.getId(),
                appointment.getPublicUuid(),
                appointment.getClient().getId(),
                appointment.getClient().getFullName(),
                appointment.getProfessional().getId(),
                appointment.getProfessional().getFullName(),
                appointment.getService().getId(),
                appointment.getService().getName(),
                appointment.getStartDateTime(),
                appointment.getEndDateTime(),
                appointment.getStatus(),
                appointment.getNotes(),
                appointment.getCancelReason(),
                appointment.getRejectionReason(),
                appointment.getCreatedByRole(),
                appointment.getConfirmedAt(),
                appointment.getCanceledAt(),
                appointment.getCompletedAt(),
                appointment.getNoShowAt(),
                appointment.getCreatedAt(),
                appointment.getUpdatedAt()
        );
    }
}
