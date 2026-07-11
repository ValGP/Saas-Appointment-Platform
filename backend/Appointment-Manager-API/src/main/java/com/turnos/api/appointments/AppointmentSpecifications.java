package com.turnos.api.appointments;

import org.springframework.data.jpa.domain.Specification;

final class AppointmentSpecifications {

    private AppointmentSpecifications() {
    }

    static Specification<Appointment> byCriteria(AppointmentSearchCriteria criteria) {
        return Specification.where(clientIdEquals(criteria.clientId()))
                .and(professionalIdEquals(criteria.professionalId()))
                .and(statusEquals(criteria.status()))
                .and(startDateTimeGreaterThanOrEqual(criteria.from()))
                .and(startDateTimeLessThanOrEqual(criteria.to()));
    }

    private static Specification<Appointment> clientIdEquals(Long clientId) {
        return (root, query, builder) -> clientId == null
                ? builder.conjunction()
                : builder.equal(root.get("client").get("id"), clientId);
    }

    private static Specification<Appointment> professionalIdEquals(Long professionalId) {
        return (root, query, builder) -> professionalId == null
                ? builder.conjunction()
                : builder.equal(root.get("professional").get("id"), professionalId);
    }

    private static Specification<Appointment> statusEquals(AppointmentStatus status) {
        return (root, query, builder) -> status == null
                ? builder.conjunction()
                : builder.equal(root.get("status"), status);
    }

    private static Specification<Appointment> startDateTimeGreaterThanOrEqual(java.time.LocalDateTime from) {
        return (root, query, builder) -> from == null
                ? builder.conjunction()
                : builder.greaterThanOrEqualTo(root.get("startDateTime"), from);
    }

    private static Specification<Appointment> startDateTimeLessThanOrEqual(java.time.LocalDateTime to) {
        return (root, query, builder) -> to == null
                ? builder.conjunction()
                : builder.lessThanOrEqualTo(root.get("startDateTime"), to);
    }
}
