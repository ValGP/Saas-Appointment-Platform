package com.turnos.api.business;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "business")
public class Business {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 140, unique = true)
    private String slug;

    @Column(nullable = false, length = 60)
    private String timezone;

    @Column(length = 40)
    private String whatsapp;

    @Column(length = 20)
    private String primaryColor;

    @Column(length = 30)
    private String themePreset;

    @Column(nullable = false)
    private boolean bookingEnabled;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private PlanType planType;

    @Column(length = 255)
    private String mpAccessToken;

    @Column(nullable = false)
    private boolean showBranding;

    @Column(nullable = false)
    private boolean active;

    @Column(nullable = false, name = "created_at")
    private LocalDateTime createdAt;

    protected Business() {
    }

    public Business(String name, String slug, String timezone, String whatsapp, String primaryColor, String themePreset, PlanType planType, String mpAccessToken, boolean showBranding) {
        this.name = requireText(name, "name");
        this.slug = requireText(slug, "slug");
        this.timezone = timezone != null ? timezone : "America/Argentina/Buenos_Aires";
        this.whatsapp = whatsapp;
        this.primaryColor = primaryColor;
        this.themePreset = themePreset;
        this.bookingEnabled = true;
        this.planType = planType != null ? planType : PlanType.FREE;
        this.mpAccessToken = mpAccessToken;
        this.showBranding = showBranding;
        this.active = true;
        this.createdAt = LocalDateTime.now();
    }

    public void updateDetails(String name, String slug, String timezone, String whatsapp, String primaryColor, String themePreset, PlanType planType, String mpAccessToken, boolean showBranding) {
        this.name = requireText(name, "name");
        this.slug = requireText(slug, "slug");
        this.timezone = timezone != null ? timezone : "America/Argentina/Buenos_Aires";
        this.whatsapp = whatsapp;
        this.primaryColor = primaryColor;
        this.themePreset = themePreset;
        this.planType = planType != null ? planType : PlanType.FREE;
        this.mpAccessToken = mpAccessToken;
        this.showBranding = showBranding;
    }

    public void activate() {
        this.active = true;
    }

    public void deactivate() {
        this.active = false;
    }

    public void setBookingEnabled(boolean bookingEnabled) {
        this.bookingEnabled = bookingEnabled;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getSlug() {
        return slug;
    }

    public String getTimezone() {
        return timezone;
    }

    public String getWhatsapp() {
        return whatsapp;
    }

    public String getPrimaryColor() {
        return primaryColor;
    }

    public String getThemePreset() {
        return themePreset;
    }

    public boolean isBookingEnabled() {
        return bookingEnabled;
    }

    public PlanType getPlanType() {
        return planType;
    }

    public String getMpAccessToken() {
        return mpAccessToken;
    }

    public boolean isShowBranding() {
        return showBranding;
    }

    public boolean isActive() {
        return active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    private static String requireText(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
        return value;
    }

    public static Business createTestBusiness(Long id) {
        Business business = new Business();
        business.id = id;
        business.name = "Test Business";
        business.slug = "test";
        business.timezone = "America/Argentina/Buenos_Aires";
        business.planType = PlanType.FREE;
        business.active = true;
        business.createdAt = java.time.LocalDateTime.now();
        return business;
    }
}
