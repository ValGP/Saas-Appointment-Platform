package com.turnos.api.professionals;

import com.turnos.api.services.Service;

import java.util.List;

public record ProfessionalServicesAssignmentResponse(
        Long professionalId,
        ServiceAssignmentMode mode,
        List<AssignedServiceResponse> services
) {
    static ProfessionalServicesAssignmentResponse from(Professional professional, List<Service> services) {
        return new ProfessionalServicesAssignmentResponse(
                professional.getId(),
                professional.getServiceAssignmentMode(),
                services.stream()
                        .map(AssignedServiceResponse::from)
                        .toList()
        );
    }

    public record AssignedServiceResponse(
            Long id,
            String name,
            boolean active
    ) {
        static AssignedServiceResponse from(Service service) {
            return new AssignedServiceResponse(
                    service.getId(),
                    service.getName(),
                    service.isActive()
            );
        }
    }
}
