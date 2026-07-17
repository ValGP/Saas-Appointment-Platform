package com.turnos.api.availability;

import java.time.LocalDateTime;

/**
 * Public-facing DTO representing a bookable time slot.
 *
 * <p>This record is returned by the {@code /api/public/available-slots} endpoint and
 * intentionally hides all internal agenda details (individual professional schedules,
 * blocks, vacations, etc.). The frontend only sees available windows.</p>
 *
 * @param start                      Start of the available slot.
 * @param end                        End of the available slot.
 * @param availableProfessionalsCount Number of professionals that can cover this slot.
 *                                   {@code null} when a specific professional was requested,
 *                                   because the count is meaningless in that context.
 */
public record AvailableSlotResponse(
        LocalDateTime start,
        LocalDateTime end,
        Integer availableProfessionalsCount
) {

    /**
     * Factory method for slots returned when a specific professional was chosen.
     * Sets {@code availableProfessionalsCount} to {@code null}.
     */
    public static AvailableSlotResponse forSpecificProfessional(LocalDateTime start, LocalDateTime end) {
        return new AvailableSlotResponse(start, end, null);
    }

    /**
     * Factory method for slots returned in "any available" mode.
     * Includes the count of professionals able to cover this slot.
     */
    public static AvailableSlotResponse forAnyProfessional(LocalDateTime start, LocalDateTime end, int count) {
        return new AvailableSlotResponse(start, end, count);
    }
}
