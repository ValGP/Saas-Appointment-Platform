package com.turnos.api.auth;

import com.turnos.api.users.UserRole;

public record AuthResponse(
        String token,
        String tokenType,
        Long userId,
        String fullName,
        String email,
        UserRole role
) {
}
