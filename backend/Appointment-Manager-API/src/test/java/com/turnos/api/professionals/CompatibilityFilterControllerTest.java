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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CompatibilityFilterControllerTest {

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
    void professionalsCanBeFilteredByCompatibleService() throws Exception {
        String token = login("admin@turnos.local", "admin1234");
        Service service = serviceRepository.save(new Service(
                "Filter Target Service",
                null,
                30,
                BigDecimal.valueOf(1000)
        ));
        Service otherService = serviceRepository.save(new Service(
                "Filter Other Service",
                null,
                45,
                BigDecimal.valueOf(1200)
        ));
        Professional allServicesProfessional = professionalRepository.save(new Professional(
                "Filter All Pro",
                "filter.all.pro@email.com",
                "123"
        ));
        Professional selectedCompatibleProfessional = professionalRepository.save(new Professional(
                "Filter Compatible Pro",
                "filter.compatible.pro@email.com",
                "123"
        ));
        Professional selectedIncompatibleProfessional = professionalRepository.save(new Professional(
                "Filter Incompatible Pro",
                "filter.incompatible.pro@email.com",
                "123"
        ));

        selectedCompatibleProfessional.setSelectedServices();
        selectedIncompatibleProfessional.setSelectedServices();
        professionalRepository.save(selectedCompatibleProfessional);
        professionalRepository.save(selectedIncompatibleProfessional);
        professionalServiceRepository.save(new ProfessionalServiceAssignment(selectedCompatibleProfessional, service));
        professionalServiceRepository.save(new ProfessionalServiceAssignment(selectedIncompatibleProfessional, otherService));

        mockMvc.perform(get("/api/professionals")
                        .param("serviceId", service.getId().toString())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == %d)]", allServicesProfessional.getId()).exists())
                .andExpect(jsonPath("$[?(@.id == %d)]", selectedCompatibleProfessional.getId()).exists())
                .andExpect(jsonPath("$[?(@.id == %d)]", selectedIncompatibleProfessional.getId()).doesNotExist());
    }

    @Test
    void servicesCanBeFilteredByCompatibleProfessional() throws Exception {
        String token = login("admin@turnos.local", "admin1234");
        Professional professional = professionalRepository.save(new Professional(
                "Filter Services Pro",
                "filter.services.pro@email.com",
                "123"
        ));
        Service assignedService = serviceRepository.save(new Service(
                "Filter Assigned Service",
                null,
                30,
                BigDecimal.valueOf(1000)
        ));
        Service unassignedService = serviceRepository.save(new Service(
                "Filter Unassigned Service",
                null,
                45,
                BigDecimal.valueOf(1200)
        ));

        professional.setSelectedServices();
        professionalRepository.save(professional);
        professionalServiceRepository.save(new ProfessionalServiceAssignment(professional, assignedService));

        mockMvc.perform(get("/api/services")
                        .param("professionalId", professional.getId().toString())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == %d)]", assignedService.getId()).exists())
                .andExpect(jsonPath("$[?(@.id == %d)]", unassignedService.getId()).doesNotExist());
    }

    @Test
    void servicesFilterReturnsAllServicesForAllServicesProfessional() throws Exception {
        String token = login("admin@turnos.local", "admin1234");
        Professional professional = professionalRepository.save(new Professional(
                "Filter All Services Pro",
                "filter.all.services.pro@email.com",
                "123"
        ));
        Service firstService = serviceRepository.save(new Service(
                "Filter All First",
                null,
                30,
                BigDecimal.valueOf(1000)
        ));
        Service secondService = serviceRepository.save(new Service(
                "Filter All Second",
                null,
                45,
                BigDecimal.valueOf(1200)
        ));

        mockMvc.perform(get("/api/services")
                        .param("professionalId", professional.getId().toString())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == %d)]", firstService.getId()).exists())
                .andExpect(jsonPath("$[?(@.id == %d)]", secondService.getId()).exists());
    }

    @Test
    void clientCanReadServicesAndCompatibleProfessionals() throws Exception {
        String token = registerClient("client.read.catalogs@email.com");
        Service service = serviceRepository.save(new Service(
                "Client Read Service",
                null,
                30,
                BigDecimal.valueOf(1000)
        ));
        Professional professional = professionalRepository.save(new Professional(
                "Client Read Pro",
                "client.read.pro@email.com",
                "123"
        ));

        mockMvc.perform(get("/api/services")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == %d)]", service.getId()).exists());

        mockMvc.perform(get("/api/professionals")
                        .param("serviceId", service.getId().toString())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == %d)]", professional.getId()).exists());
    }

    @Test
    void missingFilterIdsReturnNotFound() throws Exception {
        String token = login("admin@turnos.local", "admin1234");

        mockMvc.perform(get("/api/professionals")
                        .param("serviceId", "999999")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Service not found with id: 999999"));

        mockMvc.perform(get("/api/services")
                        .param("professionalId", "999999")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Professional not found with id: 999999"));
    }

    @Test
    void unfilteredCatalogsKeepExistingAdminBehavior() throws Exception {
        String token = login("admin@turnos.local", "admin1234");

        mockMvc.perform(get("/api/professionals")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(org.hamcrest.Matchers.greaterThanOrEqualTo(0))));

        mockMvc.perform(get("/api/services")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(org.hamcrest.Matchers.greaterThanOrEqualTo(0))));
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
}
