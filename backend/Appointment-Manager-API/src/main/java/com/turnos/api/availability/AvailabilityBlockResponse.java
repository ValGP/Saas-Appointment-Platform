package com.turnos.api.availability;

import java.time.LocalDateTime;

public record AvailabilityBlockResponse(
        Long id,
        Long professionalId,
        String professionalName,
        LocalDateTime startDateTime,
        LocalDateTime endDateTime,
        String reason,
        AvailabilityBlockType type,
        boolean active,
        LocalDateTime createdAt
) {
    static AvailabilityBlockResponse from(AvailabilityBlock block) {
        return new AvailabilityBlockResponse(
                block.getId(),
                block.getProfessional().getId(),
                block.getProfessional().getFullName(),
                block.getStartDateTime(),
                block.getEndDateTime(),
                block.getReason(),
                block.getType(),
                block.isActive(),
                block.getCreatedAt()
        );
    }
}
