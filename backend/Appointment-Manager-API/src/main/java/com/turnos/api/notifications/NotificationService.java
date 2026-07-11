package com.turnos.api.notifications;

import com.turnos.api.appointments.Appointment;

public interface NotificationService {

    void appointmentRequested(Appointment appointment);

    void appointmentCreatedByAdmin(Appointment appointment);

    void appointmentConfirmed(Appointment appointment);

    void appointmentRejected(Appointment appointment);

    void appointmentCanceledByClient(Appointment appointment);

    void appointmentCanceledByAdmin(Appointment appointment);

    void appointmentCompleted(Appointment appointment);

    void appointmentMarkedNoShow(Appointment appointment);

    void appointmentReminderDue(Appointment appointment);
}
