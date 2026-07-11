package com.turnos.api.catalogs;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.turnos.api.appointments.Appointment;
import com.turnos.api.appointments.AppointmentRepository;
import com.turnos.api.professionals.Professional;
import com.turnos.api.professionals.ProfessionalRepository;
import com.turnos.api.services.Service;
import com.turnos.api.services.ServiceRepository;
import com.turnos.api.users.User;
import com.turnos.api.users.UserRepository;
import com.turnos.api.users.UserRole;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminCatalogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ProfessionalRepository professionalRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void adminCanCreateAndDeactivateService() throws Exception {
        String token = login("admin@turnos.local", "admin1234");

        String response = mockMvc.perform(post("/api/services")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Consultation",
                                  "categoryId": 3,
                                  "description": "Initial consultation",
                                  "durationMinutes": 45,
                                  "price": 1500.00
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Consultation"))
                .andExpect(jsonPath("$.active").value(true))
                .andExpect(jsonPath("$.onlineBookable").value(true))
                .andExpect(jsonPath("$.requiresEvaluation").value(false))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long id = objectMapper.readTree(response).get("id").asLong();

        mockMvc.perform(patch("/api/services/{id}/deactivate", id)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));
    }

    @Test
    void clientCannotCreateService() throws Exception {
        String token = registerClient("client.catalog@email.com");

        mockMvc.perform(post("/api/services")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Blocked",
                                  "categoryId": 3,
                                  "description": "Should not be created",
                                  "durationMinutes": 30,
                                  "price": 1000.00
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanCreateAndDeactivateServiceCategory() throws Exception {
        String token = login("admin@turnos.local", "admin1234");

        String response = mockMvc.perform(post("/api/service-categories")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Test Category",
                                  "slug": "test-category",
                                  "description": "Category for controller test",
                                  "displayOrder": 90
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Test Category"))
                .andExpect(jsonPath("$.slug").value("test-category"))
                .andExpect(jsonPath("$.active").value(true))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long id = objectMapper.readTree(response).get("id").asLong();

        mockMvc.perform(patch("/api/service-categories/{id}/deactivate", id)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));
    }

    @Test
    void requiresEvaluationServiceIsNotOnlineBookable() throws Exception {
        String token = login("admin@turnos.local", "admin1234");

        String response = mockMvc.perform(post("/api/services")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "PRP Evaluation",
                                  "categoryId": 3,
                                  "description": "Needs previous evaluation",
                                  "durationMinutes": 45,
                                  "price": 2500.00,
                                  "onlineBookable": true,
                                  "requiresEvaluation": true
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.onlineBookable").value(false))
                .andExpect(jsonPath("$.requiresEvaluation").value(true))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long id = objectMapper.readTree(response).get("id").asLong();

        mockMvc.perform(put("/api/services/{id}", id)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "PRP Evaluation Updated",
                                  "categoryId": 3,
                                  "description": "Still needs evaluation",
                                  "durationMinutes": 45,
                                  "price": 2600.00,
                                  "onlineBookable": true,
                                  "requiresEvaluation": true
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.onlineBookable").value(false))
                .andExpect(jsonPath("$.requiresEvaluation").value(true));
    }

    @Test
    void clientCannotCreateServiceCategory() throws Exception {
        String token = registerClient("client.category@email.com");

        mockMvc.perform(post("/api/service-categories")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Blocked Category",
                                  "slug": "blocked-category",
                                  "description": "Should not be created",
                                  "displayOrder": 99
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void categoryWithActiveServicesCannotBeDeactivated() throws Exception {
        String token = login("admin@turnos.local", "admin1234");

        mockMvc.perform(post("/api/services")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Facial Category Guard",
                                  "categoryId": 3,
                                  "description": "Uses facial category",
                                  "durationMinutes": 30,
                                  "price": 1200.00
                                }
                                """))
                .andExpect(status().isCreated());

        mockMvc.perform(patch("/api/service-categories/{id}/deactivate", 3)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isConflict());
    }

    @Test
    void servicesCanBeFilteredByCategory() throws Exception {
        String token = login("admin@turnos.local", "admin1234");

        String categoryResponse = mockMvc.perform(post("/api/service-categories")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Filter Category",
                                  "slug": "filter-category",
                                  "description": "Category for filter test",
                                  "displayOrder": 91
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long categoryId = objectMapper.readTree(categoryResponse).get("id").asLong();

        mockMvc.perform(post("/api/services")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Filtered Service",
                                  "categoryId": %d,
                                  "description": "Visible by category",
                                  "durationMinutes": 30,
                                  "price": 1200.00
                                }
                                """.formatted(categoryId)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/services")
                        .param("categoryId", categoryId.toString())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Filtered Service"))
                .andExpect(jsonPath("$[0].categoryId").value(categoryId));
    }

    @Test
    void servicesCanBeFilteredByOnlineBooking() throws Exception {
        String token = login("admin@turnos.local", "admin1234");

        mockMvc.perform(post("/api/services")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Online Filter Service",
                                  "categoryId": 3,
                                  "description": "Bookable",
                                  "durationMinutes": 30,
                                  "price": 1200.00,
                                  "onlineBookable": true,
                                  "requiresEvaluation": false
                                }
                                """))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/services")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Evaluation Filter Service",
                                  "categoryId": 3,
                                  "description": "Not bookable online",
                                  "durationMinutes": 30,
                                  "price": 1200.00,
                                  "onlineBookable": false,
                                  "requiresEvaluation": true
                                }
                                """))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/services")
                        .param("onlineBookableOnly", "true")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.name == 'Online Filter Service')]").exists())
                .andExpect(jsonPath("$[?(@.name == 'Evaluation Filter Service')]").doesNotExist());
    }

    @Test
    void adminCanCreateProfessionalAndRejectDuplicateEmail() throws Exception {
        String token = login("admin@turnos.local", "admin1234");
        String request = """
                {
                  "fullName": "Professional Demo",
                  "email": "professional.demo@email.com",
                  "phone": "123"
                }
                """;

        mockMvc.perform(post("/api/professionals")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/professionals")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isConflict());
    }

    @Test
    void businessHoursRejectsOverlappingActiveRanges() throws Exception {
        String token = login("admin@turnos.local", "admin1234");
        Professional professional = professionalRepository.save(new Professional("Hours Pro", "hours.pro@email.com", "123"));

        mockMvc.perform(post("/api/business-hours")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "professionalId": %d,
                                  "dayOfWeek": "MONDAY",
                                  "startTime": "09:00:00",
                                  "endTime": "13:00:00"
                                }
                                """.formatted(professional.getId())))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/business-hours")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "professionalId": %d,
                                  "dayOfWeek": "MONDAY",
                                  "startTime": "12:00:00",
                                  "endTime": "16:00:00"
                                }
                                """.formatted(professional.getId())))
                .andExpect(status().isConflict());
    }

    @Test
    void availabilityBlockRejectsOverlapWithActiveAppointment() throws Exception {
        String token = login("admin@turnos.local", "admin1234");
        Professional professional = professionalRepository.save(new Professional("Block Pro", "block.pro@email.com", "123"));
        Service service = serviceRepository.save(new Service("Block Service", null, 30, BigDecimal.valueOf(1000)));
        User client = userRepository.save(new User(
                "Block Client",
                "block.client@email.com",
                passwordEncoder.encode("password123"),
                "123",
                UserRole.CLIENT
        ));

        appointmentRepository.save(Appointment.createConfirmedByAdmin(
                client,
                professional,
                service,
                LocalDateTime.of(2027, 5, 24, 10, 0)
        ));

        mockMvc.perform(post("/api/availability-blocks")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "professionalId": %d,
                                  "startDateTime": "2027-05-24T10:15:00",
                                  "endDateTime": "2027-05-24T11:00:00",
                                  "reason": "Manual block",
                                  "type": "MANUAL_BLOCK"
                                }
                                """.formatted(professional.getId())))
                .andExpect(status().isConflict());
    }

    @Test
    void unauthenticatedRequestsAreRejected() throws Exception {
        mockMvc.perform(get("/api/professionals"))
                .andExpect(status().isUnauthorized());
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
