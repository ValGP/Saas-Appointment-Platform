package com.turnos.api.services;

import com.turnos.api.business.Business;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.DynamicUpdate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;

import org.hibernate.annotations.Filter;

@Entity
@DynamicInsert
@DynamicUpdate
@Table(name = "services")
@Filter(name = "tenantFilter", condition = "business_id = :businessId")
public class Service {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 500)
    private String description;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private ServiceCategory category;

    @Column(nullable = false)
    private int durationMinutes;

    @Column(precision = 12, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private boolean active;

    @Column(nullable = false)
    private boolean onlineBookable;

    @Column(nullable = false)
    private boolean requiresEvaluation;

    protected Service() {
    }

    public Service(Business business, String name, String description, int durationMinutes, BigDecimal price) {
        this(business, name, description, durationMinutes, price, null, true, false);
    }

    public Service(Business business, String name, String description, int durationMinutes, BigDecimal price, ServiceCategory category) {
        this(business, name, description, durationMinutes, price, category, true, false);
    }

    @Deprecated
    public Service(String name, String description, int durationMinutes, BigDecimal price) {
        this(Business.createTestBusiness(1L), name, description, durationMinutes, price, null, true, false);
    }

    @Deprecated
    public Service(String name, String description, int durationMinutes, BigDecimal price, ServiceCategory category) {
        this(Business.createTestBusiness(1L), name, description, durationMinutes, price, category, true, false);
    }

    @Deprecated
    public Service(
            String name,
            String description,
            int durationMinutes,
            BigDecimal price,
            ServiceCategory category,
            boolean onlineBookable,
            boolean requiresEvaluation
    ) {
        this(Business.createTestBusiness(1L), name, description, durationMinutes, price, category, onlineBookable, requiresEvaluation);
    }

    public Service(
            Business business,
            String name,
            String description,
            int durationMinutes,
            BigDecimal price,
            ServiceCategory category,
            boolean onlineBookable,
            boolean requiresEvaluation
    ) {
        this.business = Objects.requireNonNull(business, "business is required");
        this.name = requireText(name, "name");
        this.description = description;
        this.durationMinutes = durationMinutes;
        this.price = price;
        this.category = category;
        this.active = true;
        updateBookingPolicy(onlineBookable, requiresEvaluation);
    }

    public void activate() {
        this.active = true;
    }

    public void deactivate() {
        this.active = false;
    }

    public void updateDetails(String name, String description, int durationMinutes, BigDecimal price) {
        this.name = requireText(name, "name");
        this.description = description;
        this.durationMinutes = durationMinutes;
        this.price = price;
    }

    public void updateDetails(String name, String description, int durationMinutes, BigDecimal price, ServiceCategory category) {
        updateDetails(name, description, durationMinutes, price);
        this.category = category;
    }

    public void updateDetails(
            String name,
            String description,
            int durationMinutes,
            BigDecimal price,
            ServiceCategory category,
            boolean onlineBookable,
            boolean requiresEvaluation
    ) {
        updateDetails(name, description, durationMinutes, price, category);
        updateBookingPolicy(onlineBookable, requiresEvaluation);
    }

    public LocalDateTime calculateEndDateTime(LocalDateTime startDateTime) {
        if (startDateTime == null) {
            throw new IllegalArgumentException("startDateTime is required");
        }
        return startDateTime.plusMinutes(durationMinutes);
    }

    public boolean hasValidDuration() {
        return durationMinutes > 0;
    }

    public boolean canBeBooked() {
        return active && hasValidDuration();
    }

    public boolean canBeBookedOnline() {
        return canBeBooked() && onlineBookable && !requiresEvaluation;
    }

    private void updateBookingPolicy(boolean onlineBookable, boolean requiresEvaluation) {
        this.requiresEvaluation = requiresEvaluation;
        this.onlineBookable = requiresEvaluation ? false : onlineBookable;
    }

    public Long getId() {
        return id;
    }

    public Business getBusiness() {
        return business;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public ServiceCategory getCategory() {
        return category;
    }

    public int getDurationMinutes() {
        return durationMinutes;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public boolean isActive() {
        return active;
    }

    public boolean isOnlineBookable() {
        return onlineBookable;
    }

    public boolean isRequiresEvaluation() {
        return requiresEvaluation;
    }

    private static String requireText(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
        return value;
    }
}
