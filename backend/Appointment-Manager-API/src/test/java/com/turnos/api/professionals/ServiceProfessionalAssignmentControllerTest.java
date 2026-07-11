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
class ServiceProfessionalAssignmentControllerTest {

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
    void adminCanAssignSelectedProfessionalsToService() throws Exception {
        String token = login("admin@turnos.local", "admin1234");
        Service targetService = serviceRepository.save(new Service(
                "Service Assignment Target",
                null,
                30,
                BigDecimal.valueOf(1000)
        ));
        Service otherService = serviceRepository.save(new Service(
                "Service Assignment Other",
                null,
                45,
                BigDecimal.valueOf(1200)
        ));
        Professional selectedProfessional = professionalRepository.save(new Professional(
                "Selected Service Pro",
                "selected.service.pro@email.com",
                "123"
        ));
        Professional excludedProfessional = professionalRepository.save(new Professional(
                "Excluded Service Pro",
                "excluded.service.pro@email.com",
                "123"
        ));

        mockMvc.perform(put("/api/services/{id}/professionals", targetService.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "mode": "SELECTED_PROFESSIONALS",
                                  "professionalIds": [%d]
                                }
                                """.formatted(selectedProfessional.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.serviceId").value(targetService.getId()))
                .andExpect(jsonPath("$.mode").value("SELECTED_PROFESSIONALS"))
                .andExpect(jsonPath("$.professionals", hasSize(1)))
                .andExpect(jsonPath("$.professionals[0].id").value(selectedProfessional.getId()));

        Professional updatedExcludedProfessional = professionalRepository.findById(excludedProfessional.getId()).orElseThrow();

        org.assertj.core.api.Assertions.assertThat(updatedExcludedProfessional.getServiceAssignmentMode())
                .isEqualTo(ServiceAssignmentMode.SELECTED_SERVICES);
        org.assertj.core.api.Assertions.assertThat(professionalServiceRepository.existsByProfessional_IdAndService_Id(
                excludedProfessional.getId(),
                targetService.getId()
        )).isFalse();
        org.assertj.core.api.Assertions.assertThat(professionalServiceRepository.existsByProfessional_IdAndService_Id(
                excludedProfessional.getId(),
                otherService.getId()
        )).isTrue();
    }

    @Test
    void adminCanReturnServiceToAllProfessionals() throws Exception {
        String token = login("admin@turnos.local", "admin1234");
        Service service = serviceRepository.save(new Service(
                "All Professionals Service",
                null,
                30,
                BigDecimal.valueOf(1000)
        ));
        Professional selectedProfessional = professionalRepository.save(new Professional(
                "Already Selected Pro",
                "already.selected.pro@email.com",
                "123"
        ));
        Professional allServicesProfessional = professionalRepository.save(new Professional(
                "Already All Pro",
                "already.all.pro@email.com",
                "123"
        ));

        selectedProfessional.setSelectedServices();
        professionalRepository.save(selectedProfessional);

        mockMvc.perform(put("/api/services/{id}/professionals", service.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "mode": "ALL_PROFESSIONALS",
                                  "professionalIds": []
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mode").value("ALL_PROFESSIONALS"))
                .andExpect(jsonPath("$.professionals[?(@.id == %d)]", selectedProfessional.getId()).exists())
                .andExpect(jsonPath("$.professionals[?(@.id == %d)]", allServicesProfessional.getId()).exists());

        org.assertj.core.api.Assertions.assertThat(professionalServiceRepository.existsByProfessional_IdAndService_Id(
                selectedProfessional.getId(),
                service.getId()
        )).isTrue();
    }

    @Test
    void clientCannotAssignProfessionalsToService() throws Exception {
        String token = registerClient("client.assign.professionals@email.com");
        Service service = serviceRepository.save(new Service(
                "Forbidden Professionals Service",
                null,
                30,
                BigDecimal.valueOf(1000)
        ));

        mockMvc.perform(put("/api/services/{id}/professionals", service.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "mode": "ALL_PROFESSIONALS",
                                  "professionalIds": []
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void missingProfessionalIdIsRejected() throws Exception {
        String token = login("admin@turnos.local", "admin1234");
        Service service = serviceRepository.save(new Service(
                "Missing Professional Service",
                null,
                30,
                BigDecimal.valueOf(1000)
        ));

        mockMvc.perform(put("/api/services/{id}/professionals", service.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "mode": "SELECTED_PROFESSIONALS",
                                  "professionalIds": [999999]
                                }
                                """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Professional not found with id: 999999"));
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
