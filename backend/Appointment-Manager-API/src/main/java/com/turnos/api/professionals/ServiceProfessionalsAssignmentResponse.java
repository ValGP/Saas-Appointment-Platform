package com.turnos.api.professionals;

import java.util.List;

public record ServiceProfessionalsAssignmentResponse(
        Long serviceId,
        ServiceProfessionalAssignmentMode mode,
        List<AssignedProfessionalResponse> professionals
) {
    static ServiceProfessionalsAssignmentResponse from(
            Long serviceId,
            ServiceProfessionalAssignmentMode mode,
            List<Professional> professionals
    ) {
        return new ServiceProfessionalsAssignmentResponse(
                serviceId,
                mode,
                professionals.stream()
                        .map(AssignedProfessionalResponse::from)
                        .toList()
        );
    }

    public record AssignedProfessionalResponse(
            Long id,
            String fullName,
            boolean active,
            ServiceAssignmentMode serviceAssignmentMode
    ) {
        static AssignedProfessionalResponse from(Professional professional) {
            return new AssignedProfessionalResponse(
                    professional.getId(),
                    professional.getFullName(),
                    professional.isActive(),
                    professional.getServiceAssignmentMode()
            );
        }
    }
}
