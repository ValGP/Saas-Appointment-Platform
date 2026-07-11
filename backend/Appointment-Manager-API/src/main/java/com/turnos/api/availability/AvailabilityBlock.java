package com.turnos.api.availability;

import com.turnos.api.business.Business;
import com.turnos.api.professionals.Professional;
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
@Table(name = "availability_blocks")
public class AvailabilityBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "professional_id", nullable = false)
    private Professional professional;

    @Column(nullable = false)
    private LocalDateTime startDateTime;

    @Column(nullable = false)
    private LocalDateTime endDateTime;

    @Column(length = 300)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AvailabilityBlockType type;

    @Column(nullable = false)
    private boolean active;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected AvailabilityBlock() {
    }

    public AvailabilityBlock(Business business, Professional professional, LocalDateTime startDateTime, LocalDateTime endDateTime, String reason, AvailabilityBlockType type) {
        this.business = Objects.requireNonNull(business, "business is required");
        this.professional = Objects.requireNonNull(professional, "professional is required");
        this.startDateTime = Objects.requireNonNull(startDateTime, "startDateTime is required");
        this.endDateTime = Objects.requireNonNull(endDateTime, "endDateTime is required");
        this.reason = reason;
        this.type = Objects.requireNonNull(type, "type is required");
        this.active = true;
        this.createdAt = LocalDateTime.now();
    }

    @Deprecated
    public AvailabilityBlock(Professional professional, LocalDateTime startDateTime, LocalDateTime endDateTime, String reason, AvailabilityBlockType type) {
        this(Business.createTestBusiness(1L), professional, startDateTime, endDateTime, reason, type);
    }

    public void activate() {
        this.active = true;
    }

    public void deactivate() {
        this.active = false;
    }

    public void updateBlock(Professional professional, LocalDateTime startDateTime, LocalDateTime endDateTime, String reason, AvailabilityBlockType type) {
        this.professional = Objects.requireNonNull(professional, "professional is required");
        this.startDateTime = Objects.requireNonNull(startDateTime, "startDateTime is required");
        this.endDateTime = Objects.requireNonNull(endDateTime, "endDateTime is required");
        this.reason = reason;
        this.type = Objects.requireNonNull(type, "type is required");
    }

    public boolean hasValidRange() {
        return startDateTime.isBefore(endDateTime);
    }

    public boolean overlapsWith(LocalDateTime otherStartDateTime, LocalDateTime otherEndDateTime) {
        if (otherStartDateTime == null || otherEndDateTime == null) {
            return false;
        }
        return startDateTime.isBefore(otherEndDateTime) && endDateTime.isAfter(otherStartDateTime);
    }

    public boolean blocksDateTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return false;
        }
        return active && !dateTime.isBefore(startDateTime) && dateTime.isBefore(endDateTime);
    }

    public boolean blocksRange(LocalDateTime otherStartDateTime, LocalDateTime otherEndDateTime) {
        return active && overlapsWith(otherStartDateTime, otherEndDateTime);
    }

    public Long getId() {
        return id;
    }

    public Business getBusiness() {
        return business;
    }

    public Professional getProfessional() {
        return professional;
    }

    public LocalDateTime getStartDateTime() {
        return startDateTime;
    }

    public LocalDateTime getEndDateTime() {
        return endDateTime;
    }

    public String getReason() {
        return reason;
    }

    public AvailabilityBlockType getType() {
        return type;
    }

    public boolean isActive() {
        return active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
