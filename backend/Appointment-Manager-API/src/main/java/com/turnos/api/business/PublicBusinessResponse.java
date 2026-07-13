package com.turnos.api.business;

public record PublicBusinessResponse(
        Long id,
        String name,
        String slug,
        String timezone,
        String whatsapp,
        String primaryColor,
        String themePreset,
        boolean bookingEnabled,
        boolean showBranding
) {
    public static PublicBusinessResponse from(Business business) {
        return new PublicBusinessResponse(
                business.getId(),
                business.getName(),
                business.getSlug(),
                business.getTimezone(),
                business.getWhatsapp(),
                business.getPrimaryColor(),
                business.getThemePreset(),
                business.isBookingEnabled(),
                business.isShowBranding()
        );
    }
}
