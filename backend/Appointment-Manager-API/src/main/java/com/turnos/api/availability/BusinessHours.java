package com.turnos.api.availability;

import com.turnos.api.professionals.Professional;
import com.turnos.api.services.Service;
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

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Objects;

@Entity
@Table(name = "business_hours")
public class BusinessHours {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "professional_id", nullable = false)
    private Professional professional;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DayOfWeek dayOfWeek;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @Column(nullable = false)
    private boolean active;

    protected BusinessHours() {
    }

    public BusinessHours(Professional professional, DayOfWeek dayOfWeek, LocalTime startTime, LocalTime endTime) {
        this.professional = Objects.requireNonNull(professional, "professional is required");
        this.dayOfWeek = Objects.requireNonNull(dayOfWeek, "dayOfWeek is required");
        this.startTime = Objects.requireNonNull(startTime, "startTime is required");
        this.endTime = Objects.requireNonNull(endTime, "endTime is required");
        this.active = true;
    }

    public void activate() {
        this.active = true;
    }

    public void deactivate() {
        this.active = false;
    }

    public void updateHours(Professional professional, DayOfWeek dayOfWeek, LocalTime startTime, LocalTime endTime) {
        this.professional = Objects.requireNonNull(professional, "professional is required");
        this.dayOfWeek = Objects.requireNonNull(dayOfWeek, "dayOfWeek is required");
        this.startTime = Objects.requireNonNull(startTime, "startTime is required");
        this.endTime = Objects.requireNonNull(endTime, "endTime is required");
    }

    public boolean belongsToDay(LocalDate date) {
        return date != null && dayOfWeek == date.getDayOfWeek();
    }

    public boolean containsRange(LocalDateTime startDateTime, LocalDateTime endDateTime) {
        if (startDateTime == null || endDateTime == null || !startDateTime.toLocalDate().equals(endDateTime.toLocalDate())) {
            return false;
        }
        return belongsToDay(startDateTime.toLocalDate())
                && !startDateTime.toLocalTime().isBefore(startTime)
                && !endDateTime.toLocalTime().isAfter(endTime);
    }

    public boolean canContainService(LocalDateTime startDateTime, Service service) {
        if (startDateTime == null || service == null) {
            return false;
        }
        return containsRange(startDateTime, service.calculateEndDateTime(startDateTime));
    }

    public boolean hasValidRange() {
        return startTime.isBefore(endTime);
    }

    public boolean overlapsWith(LocalTime otherStartTime, LocalTime otherEndTime) {
        if (otherStartTime == null || otherEndTime == null) {
            return false;
        }
        return startTime.isBefore(otherEndTime) && endTime.isAfter(otherStartTime);
    }

    public Long getId() {
        return id;
    }

    public Professional getProfessional() {
        return professional;
    }

    public DayOfWeek getDayOfWeek() {
        return dayOfWeek;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public boolean isActive() {
        return active;
    }
}
