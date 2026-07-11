package com.turnos.api.users;

import java.time.LocalDateTime;

public record ClientResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        boolean active,
        LocalDateTime createdAt
) {
    static ClientResponse from(User user) {
        return new ClientResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.isActive(),
                user.getCreatedAt()
        );
    }
}
