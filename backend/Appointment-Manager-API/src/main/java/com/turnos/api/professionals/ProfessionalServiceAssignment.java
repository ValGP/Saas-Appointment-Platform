package com.turnos.api.professionals;

import com.turnos.api.services.Service;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "professional_services")
public class ProfessionalServiceAssignment {

    @EmbeddedId
    private ProfessionalServiceId id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("professionalId")
    @JoinColumn(name = "professional_id", nullable = false)
    private Professional professional;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("serviceId")
    @JoinColumn(name = "service_id", nullable = false)
    private Service service;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected ProfessionalServiceAssignment() {
    }

    public ProfessionalServiceAssignment(Professional professional, Service service) {
        this.professional = Objects.requireNonNull(professional, "professional is required");
        this.service = Objects.requireNonNull(service, "service is required");
        this.id = new ProfessionalServiceId(professional.getId(), service.getId());
        this.createdAt = LocalDateTime.now();
    }

    public ProfessionalServiceId getId() {
        return id;
    }

    public Professional getProfessional() {
        return professional;
    }

    public Service getService() {
        return service;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
