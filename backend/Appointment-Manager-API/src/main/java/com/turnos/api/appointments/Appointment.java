package com.turnos.api.appointments;

import com.turnos.api.professionals.Professional;
import com.turnos.api.services.Service;
import com.turnos.api.users.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "appointments")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id", nullable = false)
    private User client;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "professional_id", nullable = false)
    private Professional professional;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "service_id", nullable = false)
    private Service service;

    @Column(nullable = false)
    private LocalDateTime startDateTime;

    @Column(nullable = false)
    private LocalDateTime endDateTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AppointmentStatus status;

    @Column(length = 500)
    private String notes;

    @Column(length = 300)
    private String cancelReason;

    @Column(length = 300)
    private String rejectionReason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CreatedByRole createdByRole;

    private LocalDateTime confirmedAt;
    private LocalDateTime canceledAt;
    private LocalDateTime completedAt;
    private LocalDateTime noShowAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    protected Appointment() {
    }

    private Appointment(User client, Professional professional, Service service, LocalDateTime startDateTime) {
        this.client = Objects.requireNonNull(client, "client is required");
        this.professional = Objects.requireNonNull(professional, "professional is required");
        this.service = Objects.requireNonNull(service, "service is required");
        this.startDateTime = Objects.requireNonNull(startDateTime, "startDateTime is required");
        this.endDateTime = service.calculateEndDateTime(startDateTime);
        this.createdAt = LocalDateTime.now();
        this.updatedAt = createdAt;
    }

    public static Appointment createRequestedByClient(User client, Professional professional, Service service, LocalDateTime startDateTime) {
        Appointment appointment = new Appointment(client, professional, service, startDateTime);
        appointment.status = AppointmentStatus.PENDING;
        appointment.createdByRole = CreatedByRole.CLIENT;
        return appointment;
    }

    public static Appointment createConfirmedByAdmin(User client, Professional professional, Service service, LocalDateTime startDateTime) {
        Appointment appointment = new Appointment(client, professional, service, startDateTime);
        appointment.status = AppointmentStatus.CONFIRMED;
        appointment.createdByRole = CreatedByRole.ADMIN;
        appointment.confirmedAt = LocalDateTime.now();
        return appointment;
    }

    public void confirm() {
        requireStatus(AppointmentStatus.PENDING, "Only pending appointments can be confirmed");
        this.status = AppointmentStatus.CONFIRMED;
        this.confirmedAt = LocalDateTime.now();
        touch();
    }

    public void reject(String reason) {
        requireStatus(AppointmentStatus.PENDING, "Only pending appointments can be rejected");
        this.status = AppointmentStatus.REJECTED;
        this.rejectionReason = requireText(reason, "reason");
        touch();
    }

    public void cancelByClient(String reason) {
        requirePendingOrConfirmed("Only pending or confirmed appointments can be canceled by client");
        this.status = AppointmentStatus.CANCELED_BY_CLIENT;
        this.cancelReason = requireText(reason, "reason");
        this.canceledAt = LocalDateTime.now();
        touch();
    }

    public void cancelByAdmin(String reason) {
        requirePendingOrConfirmed("Only pending or confirmed appointments can be canceled by admin");
        this.status = AppointmentStatus.CANCELED_BY_ADMIN;
        this.cancelReason = requireText(reason, "reason");
        this.canceledAt = LocalDateTime.now();
        touch();
    }

    public void complete() {
        requireStatus(AppointmentStatus.CONFIRMED, "Only confirmed appointments can be completed");
        this.status = AppointmentStatus.COMPLETED;
        this.completedAt = LocalDateTime.now();
        touch();
    }

    public void markNoShow() {
        requireStatus(AppointmentStatus.CONFIRMED, "Only confirmed appointments can be marked as no-show");
        this.status = AppointmentStatus.NO_SHOW;
        this.noShowAt = LocalDateTime.now();
        touch();
    }

    public boolean occupiesAvailability() {
        return status == AppointmentStatus.PENDING || status == AppointmentStatus.CONFIRMED;
    }

    public boolean isFinalStatus() {
        return status == AppointmentStatus.CANCELED_BY_CLIENT
                || status == AppointmentStatus.CANCELED_BY_ADMIN
                || status == AppointmentStatus.REJECTED
                || status == AppointmentStatus.COMPLETED
                || status == AppointmentStatus.NO_SHOW;
    }

    public boolean isPending() {
        return status == AppointmentStatus.PENDING;
    }

    public boolean isConfirmed() {
        return status == AppointmentStatus.CONFIRMED;
    }

    public boolean overlapsWith(LocalDateTime otherStartDateTime, LocalDateTime otherEndDateTime) {
        if (otherStartDateTime == null || otherEndDateTime == null) {
            return false;
        }
        return startDateTime.isBefore(otherEndDateTime) && endDateTime.isAfter(otherStartDateTime);
    }

    public void recalculateEndDateTime() {
        this.endDateTime = service.calculateEndDateTime(startDateTime);
        touch();
    }

    public void updateNotes(String notes) {
        this.notes = notes;
        touch();
    }

    public Long getId() {
        return id;
    }

    public User getClient() {
        return client;
    }

    public Professional getProfessional() {
        return professional;
    }

    public Service getService() {
        return service;
    }

    public LocalDateTime getStartDateTime() {
        return startDateTime;
    }

    public LocalDateTime getEndDateTime() {
        return endDateTime;
    }

    public AppointmentStatus getStatus() {
        return status;
    }

    public String getNotes() {
        return notes;
    }

    public String getCancelReason() {
        return cancelReason;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public CreatedByRole getCreatedByRole() {
        return createdByRole;
    }

    public LocalDateTime getConfirmedAt() {
        return confirmedAt;
    }

    public LocalDateTime getCanceledAt() {
        return canceledAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public LocalDateTime getNoShowAt() {
        return noShowAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    private void requireStatus(AppointmentStatus expectedStatus, String message) {
        if (status != expectedStatus) {
            throw new IllegalStateException(message);
        }
    }

    private void requirePendingOrConfirmed(String message) {
        if (status != AppointmentStatus.PENDING && status != AppointmentStatus.CONFIRMED) {
            throw new IllegalStateException(message);
        }
    }

    private void touch() {
        this.updatedAt = LocalDateTime.now();
    }

    private static String requireText(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
        return value;
    }
}
