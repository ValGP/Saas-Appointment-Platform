package com.turnos.api.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.blankOrNullString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class TenantLoginIsolationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void canRegisterSameEmailInDifferentTenants() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Shared Client",
                "shared.client@email.com",
                "password123",
                "123456"
        );

        // 1. Register in Business 1 (bibe)
        mockMvc.perform(post("/auth/register")
                        .header("X-Business-Slug", "bibe")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("shared.client@email.com"));

        // 2. Register same email in Business 2 (demo-barber)
        mockMvc.perform(post("/auth/register")
                        .header("X-Business-Slug", "demo-barber")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("shared.client@email.com"));

        // 3. Duplicate registration in Business 2 should be rejected
        mockMvc.perform(post("/auth/register")
                        .header("X-Business-Slug", "demo-barber")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    void loginIsTenantIsolated() throws Exception {
        // 1. Register user on Business 2 (demo-barber)
        RegisterRequest registerRequest = new RegisterRequest(
                "Barber Client",
                "barber.client@email.com",
                "password123",
                "9999"
        );

        mockMvc.perform(post("/auth/register")
                        .header("X-Business-Slug", "demo-barber")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

        // 2. Try to login on Business 1 (bibe) with the same credentials
        // Should return 401 Unauthorized because the email is not registered in Business 1
        LoginRequest loginRequest = new LoginRequest("barber.client@email.com", "password123");
        mockMvc.perform(post("/auth/login")
                        .header("X-Business-Slug", "bibe")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());

        // 3. Login on Business 2 (demo-barber) should succeed
        mockMvc.perform(post("/auth/login")
                        .header("X-Business-Slug", "demo-barber")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", not(blankOrNullString())));
    }
}
