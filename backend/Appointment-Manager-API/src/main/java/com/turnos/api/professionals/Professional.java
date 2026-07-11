package com.turnos.api.professionals;

import com.turnos.api.business.Business;
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
import java.util.Objects;

@Entity
@Table(name = "professionals")
public class Professional {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;

    @Column(nullable = false, length = 120)
    private String fullName;

    @Column(nullable = false, length = 160)
    private String email;

    @Column(length = 40)
    private String phone;

    @Column(nullable = false)
    private boolean active;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ServiceAssignmentMode serviceAssignmentMode;

    protected Professional() {
    }

    public Professional(Business business, String fullName, String email, String phone) {
        this.business = Objects.requireNonNull(business, "business is required");
        this.fullName = requireText(fullName, "fullName");
        this.email = requireText(email, "email").toLowerCase();
        this.phone = phone;
        this.active = true;
        this.serviceAssignmentMode = ServiceAssignmentMode.ALL_SERVICES;
    }

    @Deprecated
    public Professional(String fullName, String email, String phone) {
        this(Business.createTestBusiness(1L), fullName, email, phone);
    }

    public void activate() {
        this.active = true;
    }

    public void deactivate() {
        this.active = false;
    }

    public void updateProfile(String fullName, String email, String phone) {
        this.fullName = requireText(fullName, "fullName");
        this.email = requireText(email, "email").toLowerCase();
        this.phone = phone;
    }

    public boolean canAttendAppointments() {
        return active;
    }

    public boolean attendsAllServices() {
        return serviceAssignmentMode == ServiceAssignmentMode.ALL_SERVICES;
    }

    public boolean usesSelectedServices() {
        return serviceAssignmentMode == ServiceAssignmentMode.SELECTED_SERVICES;
    }

    public void setAllServices() {
        this.serviceAssignmentMode = ServiceAssignmentMode.ALL_SERVICES;
    }

    public void setSelectedServices() {
        this.serviceAssignmentMode = ServiceAssignmentMode.SELECTED_SERVICES;
    }

    public Long getId() {
        return id;
    }

    public Business getBusiness() {
        return business;
    }

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    public boolean isActive() {
        return active;
    }

    public ServiceAssignmentMode getServiceAssignmentMode() {
        return serviceAssignmentMode;
    }

    private static String requireText(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
        return value;
    }
}
