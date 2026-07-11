package com.turnos.api.users;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class UserTest {

    @Test
    void canRequestAppointmentsOnlyWhenClientIsActive() {
        User client = new User("Client User", "CLIENT@EMAIL.COM", "hash", "123", UserRole.CLIENT);
        User admin = new User("Admin User", "admin@email.com", "hash", "123", UserRole.ADMIN);

        assertThat(client.getEmail()).isEqualTo("client@email.com");
        assertThat(client.canRequestAppointments()).isTrue();
        assertThat(admin.canRequestAppointments()).isFalse();

        client.deactivate();

        assertThat(client.canRequestAppointments()).isFalse();
    }

    @Test
    void updatesProfileAndPassword() {
        User client = new User("Client User", "client@email.com", "old-hash", "123", UserRole.CLIENT);

        client.updateProfile("Updated Client", "456");
        client.changePassword("new-hash");

        assertThat(client.getFullName()).isEqualTo("Updated Client");
        assertThat(client.getPhone()).isEqualTo("456");
        assertThat(client.getPasswordHash()).isEqualTo("new-hash");
    }
}
