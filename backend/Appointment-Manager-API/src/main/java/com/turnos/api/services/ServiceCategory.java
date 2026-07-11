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
import java.util.Objects;

@Entity
@Table(name = "service_categories")
public class ServiceCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 140)
    private String slug;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private int displayOrder;

    @Column(nullable = false)
    private boolean active;

    protected ServiceCategory() {
    }

    public ServiceCategory(Business business, String name, String slug, String description, int displayOrder) {
        this.business = Objects.requireNonNull(business, "business is required");
        this.name = requireText(name, "name");
        this.slug = requireText(slug, "slug");
        this.description = description;
        this.displayOrder = displayOrder;
        this.active = true;
    }

    @Deprecated
    public ServiceCategory(String name, String slug, String description, int displayOrder) {
        this(Business.createTestBusiness(1L), name, slug, description, displayOrder);
    }

    public void updateDetails(String name, String slug, String description, int displayOrder) {
        this.name = requireText(name, "name");
        this.slug = requireText(slug, "slug");
        this.description = description;
        this.displayOrder = displayOrder;
    }

    public void activate() {
        this.active = true;
    }

    public void deactivate() {
        this.active = false;
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

    public String getSlug() {
        return slug;
    }

    public String getDescription() {
        return description;
    }

    public int getDisplayOrder() {
        return displayOrder;
    }

    public boolean isActive() {
        return active;
    }

    private static String requireText(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
        return value;
    }
}
