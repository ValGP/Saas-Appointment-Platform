package com.turnos.api.appointments;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.turnos.api.availability.BusinessHours;
import com.turnos.api.availability.BusinessHoursRepository;
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
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AppointmentHistoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProfessionalRepository professionalRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private BusinessHoursRepository businessHoursRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void adminCanFilterAppointmentsByClientProfessionalStatusAndDateRange() throws Exception {
        Dataset dataset = dataset("admin-history");
        String adminToken = login("admin@turnos.local", "admin1234");

        appointmentRepository.save(Appointment.createConfirmedByAdmin(
                dataset.clientOne(),
                dataset.professionalOne(),
                dataset.service(),
                LocalDateTime.of(2027, 5, 24, 10, 0)
        ));
        appointmentRepository.save(Appointment.createRequestedByClient(
                dataset.clientTwo(),
                dataset.professionalOne(),
                dataset.service(),
                LocalDateTime.of(2027, 5, 24, 11, 0)
        ));
        appointmentRepository.save(Appointment.createConfirmedByAdmin(
                dataset.clientOne(),
                dataset.professionalTwo(),
                dataset.service(),
                LocalDateTime.of(2027, 5, 25, 10, 0)
        ));

        mockMvc.perform(get("/api/appointments")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("clientId", dataset.clientOne().getId().toString())
                        .param("professionalId", dataset.professionalOne().getId().toString())
                        .param("status", "CONFIRMED")
                        .param("from", "2027-05-24T00:00:00")
                        .param("to", "2027-05-24T23:59:59"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].clientId").value(dataset.clientOne().getId()))
                .andExpect(jsonPath("$.content[0].professionalId").value(dataset.professionalOne().getId()))
                .andExpect(jsonPath("$.content[0].status").value("CONFIRMED"));
    }

    @Test
    void clientOnlySeesOwnAppointmentsEvenWhenFilteringAnotherClient() throws Exception {
        Dataset dataset = dataset("client-history");
        String clientOneToken = login(dataset.clientOne().getEmail(), "password123");

        appointmentRepository.save(Appointment.createRequestedByClient(
                dataset.clientOne(),
                dataset.professionalOne(),
                dataset.service(),
                LocalDateTime.of(2027, 5, 24, 10, 0)
        ));
        appointmentRepository.save(Appointment.createRequestedByClient(
                dataset.clientTwo(),
                dataset.professionalOne(),
                dataset.service(),
                LocalDateTime.of(2027, 5, 24, 11, 0)
        ));

        mockMvc.perform(get("/api/appointments")
                        .header("Authorization", "Bearer " + clientOneToken)
                        .param("clientId", dataset.clientTwo().getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].clientId").value(dataset.clientOne().getId()));
    }

    @Test
    void supportsPaginationAndSorting() throws Exception {
        Dataset dataset = dataset("pagination-history");
        String adminToken = login("admin@turnos.local", "admin1234");

        appointmentRepository.save(Appointment.createConfirmedByAdmin(
                dataset.clientOne(),
                dataset.professionalOne(),
                dataset.service(),
                LocalDateTime.of(2027, 5, 24, 10, 0)
        ));
        appointmentRepository.save(Appointment.createConfirmedByAdmin(
                dataset.clientOne(),
                dataset.professionalOne(),
                dataset.service(),
                LocalDateTime.of(2027, 5, 24, 11, 0)
        ));
        appointmentRepository.save(Appointment.createConfirmedByAdmin(
                dataset.clientOne(),
                dataset.professionalOne(),
                dataset.service(),
                LocalDateTime.of(2027, 5, 24, 12, 0)
        ));

        mockMvc.perform(get("/api/appointments")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("professionalId", dataset.professionalOne().getId().toString())
                        .param("page", "0")
                        .param("size", "2")
                        .param("sort", "startDateTime,desc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.content[0].startDateTime").value("2027-05-24T12:00:00"))
                .andExpect(jsonPath("$.content[1].startDateTime").value("2027-05-24T11:00:00"))
                .andExpect(jsonPath("$.totalElements").value(3));
    }

    private Dataset dataset(String suffix) {
        User clientOne = createClient(suffix + ".client.one@email.com");
        User clientTwo = createClient(suffix + ".client.two@email.com");
        Professional professionalOne = professionalRepository.save(new Professional(
                "Professional One " + suffix,
                suffix + ".professional.one@email.com",
                "123"
        ));
        Professional professionalTwo = professionalRepository.save(new Professional(
                "Professional Two " + suffix,
                suffix + ".professional.two@email.com",
                "123"
        ));
        Service service = serviceRepository.save(new Service(
                "Service " + suffix,
                null,
                30,
                BigDecimal.valueOf(1000)
        ));
        businessHoursRepository.save(new BusinessHours(professionalOne, DayOfWeek.MONDAY, LocalTime.of(9, 0), LocalTime.of(17, 0)));
        businessHoursRepository.save(new BusinessHours(professionalTwo, DayOfWeek.TUESDAY, LocalTime.of(9, 0), LocalTime.of(17, 0)));
        return new Dataset(clientOne, clientTwo, professionalOne, professionalTwo, service);
    }

    private User createClient(String email) {
        return userRepository.save(new User(
                "Client " + email,
                email,
                passwordEncoder.encode("password123"),
                "123",
                UserRole.CLIENT
        ));
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

    private record Dataset(
            User clientOne,
            User clientTwo,
            Professional professionalOne,
            Professional professionalTwo,
            Service service
    ) {
    }
}
