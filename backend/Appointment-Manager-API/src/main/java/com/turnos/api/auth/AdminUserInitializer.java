package com.turnos.api.auth;

import com.turnos.api.users.User;
import com.turnos.api.users.UserRepository;
import com.turnos.api.users.UserRole;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AdminUserInitializer implements CommandLineRunner {

    private final AdminProperties properties;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminUserInitializer(AdminProperties properties, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.properties = properties;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        String email = properties.email().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            return;
        }

        User admin = new User(
                properties.fullName(),
                email,
                passwordEncoder.encode(properties.password()),
                properties.phone(),
                UserRole.ADMIN
        );

        userRepository.save(admin);
    }
}
