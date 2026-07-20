package com.turnos.api.business;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.turnos.api.auth.LoginRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class MultiTenantIsolationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private BusinessRepository businessRepository;

    @Autowired
    private com.turnos.api.users.UserRepository userRepository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        userRepository.findByEmail("admin@demo-barber.com").ifPresent(user -> {
            user.changePassword(passwordEncoder.encode("demo1234"));
            userRepository.save(user);
        });
    }

    @Test

    void publicServicesAreTenantIsolated() throws Exception {
        // Business 1 (bibe) should have its own services (seeded/fixtures)
        mockMvc.perform(get("/api/public/services")
                        .header("X-Business-Slug", "bibe"))
                .andExpect(status().isOk());

        // Business 2 (demo-barber) should have 4 services (Corte clásico, Fade, Barba completa, Corte + Barba)
        mockMvc.perform(get("/api/public/services")
                        .header("X-Business-Slug", "demo-barber"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(4)))
                .andExpect(jsonPath("$[0].name").value("Corte clásico"))
                .andExpect(jsonPath("$[1].name").value("Fade"))
                .andExpect(jsonPath("$[2].name").value("Barba completa"))
                .andExpect(jsonPath("$[3].name").value("Corte + Barba"));
    }

    @Test
    void publicProfessionalsAreTenantIsolated() throws Exception {
        // Business 2 (demo-barber) should have 2 professionals (Carlos Barbero, Juan Navaja)
        mockMvc.perform(get("/api/public/professionals")
                        .header("X-Business-Slug", "demo-barber"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].fullName").value("Carlos Barbero"))
                .andExpect(jsonPath("$[1].fullName").value("Juan Navaja"));
    }

    @Test
    void adminCannotAccessOtherTenantData() throws Exception {
        // 1. Login as Business 2 admin (admin@demo-barber.com)
        LoginRequest loginRequest = new LoginRequest("admin@demo-barber.com", "demo1234");
        MvcResult loginResult = mockMvc.perform(post("/auth/login")
                        .header("X-Business-Slug", "demo-barber")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andReturn();

        String responseString = loginResult.getResponse().getContentAsString();
        String token = objectMapper.readTree(responseString).get("token").asText();

        // 2. Perform request to /api/businesses/my, which uses TenantContext
        // Even with the X-Business-Slug pointing to "bibe", the authenticated security context takes precedence
        // or isolates to business 2 because the JWT contains businessId = 2.
        mockMvc.perform(get("/api/businesses/my")
                        .header("Authorization", "Bearer " + token)
                        .header("X-Business-Slug", "bibe"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slug").value("demo-barber"))
                .andExpect(jsonPath("$.name").value("Demo Barber"));
    }
}
