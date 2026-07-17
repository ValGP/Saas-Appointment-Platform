package com.turnos.api.appointments;

import com.turnos.api.professionals.Professional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Strategy for resolving which professional will attend an appointment
 * when the client has not chosen one explicitly.
 *
 * <p>Implementing classes encapsulate a specific assignment algorithm without
 * modifying the booking flow in {@link AppointmentService}. This decoupling
 * means new strategies (e.g. least-loaded, round-robin, priority-based) can be
 * added in the future by providing a new implementation and swapping the
 * Spring component — no changes to the service layer required.</p>
 *
 * <p>Contract:</p>
 * <ul>
 *   <li>The {@code candidates} list contains only professionals that are
 *       already confirmed to be active and assigned to the requested service.
 *       Implementations must NOT re-validate those conditions.</li>
 *   <li>Implementations MUST verify real-time slot availability (no overlapping
 *       appointments, no active blocks, inside business hours) before accepting
 *       a candidate.</li>
 *   <li>If no candidate can cover the requested slot, implementations MUST throw
 *       a {@link com.turnos.api.common.ConflictException} with a descriptive
 *       message so the API returns an appropriate 409 response.</li>
 * </ul>
 *
 * <p>MVP implementation: {@link FirstAvailableStrategy}</p>
 */
public interface ProfessionalAssignmentStrategy {

    /**
     * Resolves a professional to attend the appointment.
     *
     * @param service    the service to be rendered
     * @param start      appointment start (must be in the future, already validated)
     * @param end        appointment end (derived from service duration)
     * @param candidates active professionals assigned to the service; never empty
     * @return the resolved professional — never {@code null}
     * @throws com.turnos.api.common.ConflictException if no candidate is available
     *         for the requested slot
     */
    Professional resolve(
            com.turnos.api.services.Service service,
            LocalDateTime start,
            LocalDateTime end,
            List<Professional> candidates
    );
}
