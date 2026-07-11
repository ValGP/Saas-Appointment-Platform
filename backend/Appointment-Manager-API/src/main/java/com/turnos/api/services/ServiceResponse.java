package com.turnos.api.services;

import java.math.BigDecimal;

public record ServiceResponse(
        Long id,
        String name,
        Long categoryId,
        String categoryName,
        String categorySlug,
        String description,
        int durationMinutes,
        BigDecimal price,
        boolean active,
        boolean onlineBookable,
        boolean requiresEvaluation
) {
    static ServiceResponse from(Service service) {
        return new ServiceResponse(
                service.getId(),
                service.getName(),
                service.getCategory() != null ? service.getCategory().getId() : null,
                service.getCategory() != null ? service.getCategory().getName() : null,
                service.getCategory() != null ? service.getCategory().getSlug() : null,
                service.getDescription(),
                service.getDurationMinutes(),
                service.getPrice(),
                service.isActive(),
                service.isOnlineBookable(),
                service.isRequiresEvaluation()
        );
    }
}
