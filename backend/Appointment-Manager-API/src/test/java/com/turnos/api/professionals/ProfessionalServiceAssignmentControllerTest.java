package com.turnos.api.professionals;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.turnos.api.services.Service;
import com.turnos.api.services.ServiceRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProfessionalServiceAssignmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ProfessionalRepository professionalRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private ProfessionalServiceRepository professionalServiceRepository;

    @Test
    void adminCanAssignSelectedServicesToProfessional() throws Exception {
        String token = login("admin@turnos.local", "admin1234");
        Professional professional = professionalRepository.save(new Professional(
                "Endpoint Pro",
                "endpoint.pro@email.com",
                "123"
        ));
        Service firstService = serviceRepository.save(new Service(
                "Endpoint Service One",
                null,
                30,
                BigDecimal.valueOf(1000)
        ));
        Service secondService = serviceRepository.save(new Service(
                "Endpoint Service Two",
                null,
                45,
                BigDecimal.valueOf(1200)
        ));

        mockMvc.perform(put("/api/professionals/{id}/services", professional.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "mode": "SELECTED_SERVICES",
                                  "serviceIds": [%d, %d, %d]
                                }
                                """.formatted(firstService.getId(), secondService.getId(), firstService.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.professionalId").value(professional.getId()))
                .andExpect(jsonPath("$.mode").value("SELECTED_SERVICES"))
                .andExpect(jsonPath("$.services", hasSize(2)))
                .andExpect(jsonPath("$.services[0].id").value(firstService.getId()))
                .andExpect(jsonPath("$.services[1].id").value(secondService.getId()));

        mockMvc.perform(get("/api/professionals/{id}/services", professional.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mode").value("SELECTED_SERVICES"))
                .andExpect(jsonPath("$.services", hasSize(2)));
    }

    @Test
    void adminCanReturnProfessionalToAllServicesAndClearAssignments() throws Exception {
        String token = login("admin@turnos.local", "admin1234");
        Professional professional = professionalRepository.save(new Professional(
                "Clear Assignment Pro",
                "clear.assignment.pro@email.com",
                "123"
        ));
        Service service = serviceRepository.save(new Service(
                "Clear Assignment Service",
                null,
                30,
                BigDecimal.valueOf(1000)
        ));
        professional.setSelectedServices();
        professionalRepository.save(professional);
        professionalServiceRepository.save(new ProfessionalServiceAssignment(professional, service));

        mockMvc.perform(put("/api/professionals/{id}/services", professional.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "mode": "ALL_SERVICES",
                                  "serviceIds": [%d]
                                }
                                """.formatted(service.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mode").value("ALL_SERVICES"))
                .andExpect(jsonPath("$.services", hasSize(0)));

        mockMvc.perform(get("/api/professionals/{id}/services", professional.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mode").value("ALL_SERVICES"))
                .andExpect(jsonPath("$.services", hasSize(0)));
    }

    @Test
    void clientCannotAssignServicesToProfessional() throws Exception {
        String token = registerClient("client.assign.services@email.com");
        Professional professional = professionalRepository.save(new Professional(
                "Forbidden Assignment Pro",
                "forbidden.assignment.pro@email.com",
                "123"
        ));

        mockMvc.perform(put("/api/professionals/{id}/services", professional.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "mode": "ALL_SERVICES",
                                  "serviceIds": []
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void missingServiceIdIsRejected() throws Exception {
        String token = login("admin@turnos.local", "admin1234");
        Professional professional = professionalRepository.save(new Professional(
                "Missing Service Pro",
                "missing.service.pro@email.com",
                "123"
        ));

        mockMvc.perform(put("/api/professionals/{id}/services", professional.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "mode": "SELECTED_SERVICES",
                                  "serviceIds": [999999]
                                }
                                """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Service not found with id: 999999"));
    }

    private String registerClient(String email) throws Exception {
        String response = mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fullName": "Client",
                                  "email": "%s",
                                  "password": "password123",
                                  "phone": "123"
                                }
                                """.formatted(email)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).get("token").asText();
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
