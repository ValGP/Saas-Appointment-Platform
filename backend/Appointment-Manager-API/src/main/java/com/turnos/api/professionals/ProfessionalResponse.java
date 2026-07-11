package com.turnos.api.professionals;

public record ProfessionalResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        boolean active
) {
    static ProfessionalResponse from(Professional professional) {
        return new ProfessionalResponse(
                professional.getId(),
                professional.getFullName(),
                professional.getEmail(),
                professional.getPhone(),
                professional.isActive()
        );
    }
}
