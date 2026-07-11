package com.turnos.api.professionals;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class ProfessionalServiceId implements Serializable {

    @Column(name = "professional_id")
    private Long professionalId;

    @Column(name = "service_id")
    private Long serviceId;

    protected ProfessionalServiceId() {
    }

    public ProfessionalServiceId(Long professionalId, Long serviceId) {
        this.professionalId = Objects.requireNonNull(professionalId, "professionalId is required");
        this.serviceId = Objects.requireNonNull(serviceId, "serviceId is required");
    }

    public Long getProfessionalId() {
        return professionalId;
    }

    public Long getServiceId() {
        return serviceId;
    }

    @Override
    public boolean equals(Object object) {
        if (this == object) {
            return true;
        }
        if (!(object instanceof ProfessionalServiceId that)) {
            return false;
        }
        return Objects.equals(professionalId, that.professionalId)
                && Objects.equals(serviceId, that.serviceId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(professionalId, serviceId);
    }
}
