package com.turnos.api.business;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BusinessControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void getMyBusinessRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/businesses/my"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminCanGetAndUpdateMyBusiness() throws Exception {
        String token = login("admin@turnos.local", "admin1234");

        // 1. Get my business config
        mockMvc.perform(get("/api/businesses/my")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("BIBE Estetica"))
                .andExpect(jsonPath("$.primaryColor").value("#ff007f"))
                .andExpect(jsonPath("$.showBranding").value(false));

        // 2. Update my business config
        BusinessUpdateRequest updateRequest = new BusinessUpdateRequest(
                "BIBE Estetica Renovada",
                "5491122334455",
                "#ff007f",
                false
        );

        mockMvc.perform(put("/api/businesses/my")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("BIBE Estetica Renovada"))
                .andExpect(jsonPath("$.whatsapp").value("5491122334455"))
                .andExpect(jsonPath("$.primaryColor").value("#ff007f"))
                .andExpect(jsonPath("$.showBranding").value(false));

        // 3. Verify it was saved by fetching it publicly
        mockMvc.perform(get("/api/public/businesses/bibe"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("BIBE Estetica Renovada"))
                .andExpect(jsonPath("$.primaryColor").value("#ff007f"))
                .andExpect(jsonPath("$.showBranding").value(false));
    }

    private String login(String email, String password) throws Exception {
        String response = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "%s"
                                }
                                """.formatted(email, password)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).get("token").asText();
    }
}
