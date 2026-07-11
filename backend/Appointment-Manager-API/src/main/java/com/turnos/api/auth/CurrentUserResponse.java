package com.turnos.api.auth;

import com.turnos.api.users.UserRole;

public record CurrentUserResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        UserRole role,
        boolean active
) {
}
