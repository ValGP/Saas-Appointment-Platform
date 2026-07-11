package com.turnos.api.notifications;

import com.turnos.api.appointments.Appointment;

public class NoOpNotificationService implements NotificationService {

    @Override
    public void appointmentRequested(Appointment appointment) {
    }

    @Override
    public void appointmentCreatedByAdmin(Appointment appointment) {
    }

    @Override
    public void appointmentConfirmed(Appointment appointment) {
    }

    @Override
    public void appointmentRejected(Appointment appointment) {
    }

    @Override
    public void appointmentCanceledByClient(Appointment appointment) {
    }

    @Override
    public void appointmentCanceledByAdmin(Appointment appointment) {
    }

    @Override
    public void appointmentCompleted(Appointment appointment) {
    }

    @Override
    public void appointmentMarkedNoShow(Appointment appointment) {
    }

    @Override
    public void appointmentReminderDue(Appointment appointment) {
    }
}
