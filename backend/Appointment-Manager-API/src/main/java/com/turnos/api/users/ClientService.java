package com.turnos.api.users;

import com.turnos.api.business.Business;
import com.turnos.api.business.BusinessRepository;
import com.turnos.api.business.TenantContext;
import com.turnos.api.common.ConflictException;
import com.turnos.api.common.ResourceNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@org.springframework.stereotype.Service
public class ClientService {

    private final UserRepository userRepository;
    private final BusinessRepository businessRepository;
    private final PasswordEncoder passwordEncoder;

    public ClientService(UserRepository userRepository, BusinessRepository businessRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.businessRepository = businessRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public ClientResponse create(ClientRequest request) {
        String email = normalizeEmail(request.email());
        if (request.password() == null || request.password().isBlank()) {
            throw new IllegalArgumentException("password is required");
        }
        validatePasswordLength(request.password());
        ensureEmailAvailable(email, null);

        Business business = getActiveBusiness();

        User client = new User(
                business,
                request.fullName(),
                email,
                passwordEncoder.encode(request.password()),
                request.phone(),
                UserRole.CLIENT
        );

        return ClientResponse.from(userRepository.save(client));
    }

    @Transactional(readOnly = true)
    public List<ClientResponse> findAll() {
        return userRepository.findByRole(UserRole.CLIENT).stream()
                .map(ClientResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ClientResponse findById(Long id) {
        return ClientResponse.from(getClient(id));
    }

    @Transactional
    public ClientResponse update(Long id, ClientRequest request) {
        User client = getClient(id);
        String email = normalizeEmail(request.email());
        ensureEmailAvailable(email, id);

        client.updateProfile(request.fullName(), email, request.phone());
        if (request.password() != null && !request.password().isBlank()) {
            validatePasswordLength(request.password());
            client.changePassword(passwordEncoder.encode(request.password()));
        }

        return ClientResponse.from(client);
    }

    @Transactional
    public ClientResponse activate(Long id) {
        User client = getClient(id);
        client.activate();
        return ClientResponse.from(client);
    }

    @Transactional
    public ClientResponse deactivate(Long id) {
        User client = getClient(id);
        client.deactivate();
        return ClientResponse.from(client);
    }

    private User getClient(Long id) {
        return userRepository.findByIdAndRole(id, UserRole.CLIENT)
                .orElseThrow(() -> new ResourceNotFoundException("Client", id));
    }

    private void ensureEmailAvailable(String email, Long currentClientId) {
        userRepository.findByEmail(email)
                .filter(existing -> currentClientId == null || !existing.getId().equals(currentClientId))
                .ifPresent(existing -> {
                    throw new ConflictException("Client email already registered: " + email);
                });
    }

    private String normalizeEmail(String email) {
        return email.toLowerCase();
    }

    private void validatePasswordLength(String password) {
        if (password.length() < 8 || password.length() > 100) {
            throw new IllegalArgumentException("password size must be between 8 and 100");
        }
    }

    private Business getActiveBusiness() {
        Business business = TenantContext.getCurrentTenant();
        if (business == null) {
            return businessRepository.findById(1L)
                    .orElseThrow(() -> new IllegalStateException("Default business with ID 1 must exist"));
        }
        return business;
    }
}
