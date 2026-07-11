package com.turnos.api.services;

public record ServiceCategoryResponse(
        Long id,
        String name,
        String slug,
        String description,
        int displayOrder,
        boolean active
) {
    static ServiceCategoryResponse from(ServiceCategory category) {
        return new ServiceCategoryResponse(
                category.getId(),
                category.getName(),
                category.getSlug(),
                category.getDescription(),
                category.getDisplayOrder(),
                category.isActive()
        );
    }
}
