package com.turnos.api.users;

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

import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "app_users")
public class User {

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

    @Column(nullable = false)
    private String passwordHash;

    @Column(length = 40)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role;

    @Column(nullable = false)
    private boolean active;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected User() {
    }

    public User(Business business, String fullName, String email, String passwordHash, String phone, UserRole role) {
        this.business = Objects.requireNonNull(business, "business is required");
        this.fullName = requireText(fullName, "fullName");
        this.email = requireText(email, "email").toLowerCase();
        this.passwordHash = requireText(passwordHash, "passwordHash");
        this.phone = phone;
        this.role = Objects.requireNonNull(role, "role is required");
        this.active = true;
        this.createdAt = LocalDateTime.now();
    }

    @Deprecated
    public User(String fullName, String email, String passwordHash, String phone, UserRole role) {
        this(Business.createTestBusiness(1L), fullName, email, passwordHash, phone, role);
    }

    public void activate() {
        this.active = true;
    }

    public void deactivate() {
        this.active = false;
    }

    public void updateProfile(String fullName, String phone) {
        this.fullName = requireText(fullName, "fullName");
        this.phone = phone;
    }

    public void updateProfile(String fullName, String email, String phone) {
        this.fullName = requireText(fullName, "fullName");
        this.email = requireText(email, "email").toLowerCase();
        this.phone = phone;
    }

    public void changePassword(String newPasswordHash) {
        this.passwordHash = requireText(newPasswordHash, "newPasswordHash");
    }

    public boolean isAdmin() {
        return role == UserRole.ADMIN;
    }

    public boolean isClient() {
        return role == UserRole.CLIENT;
    }

    public boolean canRequestAppointments() {
        return active && isClient();
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

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getPhone() {
        return phone;
    }

    public UserRole getRole() {
        return role;
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
}
