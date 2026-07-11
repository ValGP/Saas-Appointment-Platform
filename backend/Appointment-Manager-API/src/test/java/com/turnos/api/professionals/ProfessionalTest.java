package com.turnos.api.professionals;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ProfessionalTest {

    @Test
    void canAttendAppointmentsOnlyWhenActive() {
        Professional professional = new Professional("Professional", "PRO@EMAIL.COM", "123");

        assertThat(professional.getEmail()).isEqualTo("pro@email.com");
        assertThat(professional.canAttendAppointments()).isTrue();

        professional.deactivate();

        assertThat(professional.canAttendAppointments()).isFalse();
    }

    @Test
    void attendsAllServicesByDefaultAndCanUseSelectedServices() {
        Professional professional = new Professional("Professional", "pro@email.com", "123");

        assertThat(professional.getServiceAssignmentMode()).isEqualTo(ServiceAssignmentMode.ALL_SERVICES);
        assertThat(professional.attendsAllServices()).isTrue();
        assertThat(professional.usesSelectedServices()).isFalse();

        professional.setSelectedServices();

        assertThat(professional.getServiceAssignmentMode()).isEqualTo(ServiceAssignmentMode.SELECTED_SERVICES);
        assertThat(professional.attendsAllServices()).isFalse();
        assertThat(professional.usesSelectedServices()).isTrue();

        professional.setAllServices();

        assertThat(professional.getServiceAssignmentMode()).isEqualTo(ServiceAssignmentMode.ALL_SERVICES);
        assertThat(professional.attendsAllServices()).isTrue();
    }
}
