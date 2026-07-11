package com.turnos.api.appointments;

import com.turnos.api.professionals.Professional;
import com.turnos.api.services.Service;
import com.turnos.api.users.User;
import com.turnos.api.users.UserRole;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AppointmentTest {

    private final User client = new User("Client", "client@email.com", "hash", "123", UserRole.CLIENT);
    private final Professional professional = new Professional("Professional", "pro@email.com", "123");
    private final Service service = new Service("Session", null, 30, null);
    private final LocalDateTime start = LocalDateTime.of(2027, 5, 24, 10, 0);

    @Test
    void createsRequestedAppointmentByClientAsPending() {
        Appointment appointment = Appointment.createRequestedByClient(client, professional, service, start);

        assertThat(appointment.getStatus()).isEqualTo(AppointmentStatus.PENDING);
        assertThat(appointment.getCreatedByRole()).isEqualTo(CreatedByRole.CLIENT);
        assertThat(appointment.getEndDateTime()).isEqualTo(LocalDateTime.of(2027, 5, 24, 10, 30));
        assertThat(appointment.occupiesAvailability()).isTrue();
    }

    @Test
    void createsConfirmedAppointmentByAdminAsConfirmed() {
        Appointment appointment = Appointment.createConfirmedByAdmin(client, professional, service, start);

        assertThat(appointment.getStatus()).isEqualTo(AppointmentStatus.CONFIRMED);
        assertThat(appointment.getCreatedByRole()).isEqualTo(CreatedByRole.ADMIN);
        assertThat(appointment.getConfirmedAt()).isNotNull();
    }

    @Test
    void allowsValidTransitionsFromPendingAndConfirmed() {
        Appointment appointment = Appointment.createRequestedByClient(client, professional, service, start);

        appointment.confirm();
        appointment.complete();

        assertThat(appointment.getStatus()).isEqualTo(AppointmentStatus.COMPLETED);
        assertThat(appointment.isFinalStatus()).isTrue();
        assertThat(appointment.occupiesAvailability()).isFalse();
    }

    @Test
    void rejectsInvalidTransitionsFromFinalStatus() {
        Appointment appointment = Appointment.createRequestedByClient(client, professional, service, start);
        appointment.reject("No availability");

        assertThatThrownBy(appointment::confirm)
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void detectsOverlaps() {
        Appointment appointment = Appointment.createRequestedByClient(client, professional, service, start);

        assertThat(appointment.overlapsWith(
                LocalDateTime.of(2027, 5, 24, 10, 15),
                LocalDateTime.of(2027, 5, 24, 10, 45)
        )).isTrue();
        assertThat(appointment.overlapsWith(
                LocalDateTime.of(2027, 5, 24, 10, 30),
                LocalDateTime.of(2027, 5, 24, 11, 0)
        )).isFalse();
    }
}
