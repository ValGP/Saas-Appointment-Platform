package com.turnos.api.availability;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.turnos.api.appointments.Appointment;
import com.turnos.api.appointments.AppointmentRepository;
import com.turnos.api.professionals.Professional;
import com.turnos.api.professionals.ProfessionalRepository;
import com.turnos.api.professionals.ProfessionalServiceAssignment;
import com.turnos.api.professionals.ProfessionalServiceRepository;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AvailabilityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ProfessionalRepository professionalRepository;

    @Autowired
    private ProfessionalServiceRepository professionalServiceRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private BusinessHoursRepository businessHoursRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private AvailabilityBlockRepository availabilityBlockRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void returnsSlotsInsideBusinessHoursUsingServiceDuration() throws Exception {
        Fixture fixture = fixture("availability-basic", 60);
        String token = registerClient("availability.basic.client@email.com");

        mockMvc.perform(get("/api/availability")
                        .header("Authorization", "Bearer " + token)
                        .param("professionalId", fixture.professional().getId().toString())
                        .param("serviceId", fixture.service().getId().toString())
                        .param("date", "2027-05-24"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].startDateTime").value("2027-05-24T09:00:00"))
                .andExpect(jsonPath("$[0].endDateTime").value("2027-05-24T10:00:00"))
                .andExpect(jsonPath("$[7].startDateTime").value("2027-05-24T16:00:00"))
                .andExpect(jsonPath("$[7].endDateTime").value("2027-05-24T17:00:00"));
    }

    @Test
    void excludesPendingAndConfirmedAppointments() throws Exception {
        Fixture fixture = fixture("availability-appointments", 60);
        User client = createClient("availability.appointment.client@email.com");
        appointmentRepository.save(Appointment.createRequestedByClient(
                client,
                fixture.professional(),
                fixture.service(),
                LocalDateTime.of(2027, 5, 24, 10, 0)
        ));
        appointmentRepository.save(Appointment.createConfirmedByAdmin(
                client,
                fixture.professional(),
                fixture.service(),
                LocalDateTime.of(2027, 5, 24, 12, 0)
        ));
        String token = registerClient("availability.appointment.viewer@email.com");

        String response = mockMvc.perform(get("/api/availability")
                        .header("Authorization", "Bearer " + token)
                        .param("professionalId", fixture.professional().getId().toString())
                        .param("serviceId", fixture.service().getId().toString())
                        .param("date", "2027-05-24"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode slots = objectMapper.readTree(response);
        assertThat(startTimes(slots)).doesNotContain("2027-05-24T10:00:00", "2027-05-24T12:00:00");
    }

    @Test
    void excludesActiveAvailabilityBlocks() throws Exception {
        Fixture fixture = fixture("availability-blocks", 60);
        availabilityBlockRepository.save(new AvailabilityBlock(
                fixture.professional(),
                LocalDateTime.of(2027, 5, 24, 13, 0),
                LocalDateTime.of(2027, 5, 24, 15, 0),
                "Unavailable",
                AvailabilityBlockType.MANUAL_BLOCK
        ));
        String token = registerClient("availability.block.viewer@email.com");

        String response = mockMvc.perform(get("/api/availability")
                        .header("Authorization", "Bearer " + token)
                        .param("professionalId", fixture.professional().getId().toString())
                        .param("serviceId", fixture.service().getId().toString())
                        .param("date", "2027-05-24"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode slots = objectMapper.readTree(response);
        assertThat(startTimes(slots)).doesNotContain("2027-05-24T13:00:00", "2027-05-24T14:00:00");
    }

    @Test
    void inactiveProfessionalOrServiceReturnConflict() throws Exception {
        Fixture inactiveProfessionalFixture = fixture("availability-inactive-professional", 60);
        inactiveProfessionalFixture.professional().deactivate();
        professionalRepository.save(inactiveProfessionalFixture.professional());
        Fixture inactiveServiceFixture = fixture("availability-inactive-service", 60);
        Service inactiveService = serviceRepository.findById(inactiveServiceFixture.service().getId()).orElseThrow();
        inactiveService.deactivate();
        serviceRepository.save(inactiveService);
        String token = registerClient("availability.inactive.viewer@email.com");

        mockMvc.perform(get("/api/availability")
                        .header("Authorization", "Bearer " + token)
                        .param("professionalId", inactiveProfessionalFixture.professional().getId().toString())
                        .param("serviceId", inactiveProfessionalFixture.service().getId().toString())
                        .param("date", "2027-05-24"))
                .andExpect(status().isConflict());

        mockMvc.perform(get("/api/availability")
                        .header("Authorization", "Bearer " + token)
                        .param("professionalId", inactiveServiceFixture.professional().getId().toString())
                        .param("serviceId", inactiveServiceFixture.service().getId().toString())
                        .param("date", "2027-05-24"))
                .andExpect(status().isConflict());
    }

    @Test
    void dayWithoutBusinessHoursReturnsEmptyList() throws Exception {
        Fixture fixture = fixture("availability-empty-day", 60);
        String token = registerClient("availability.empty.viewer@email.com");

        mockMvc.perform(get("/api/availability")
                        .header("Authorization", "Bearer " + token)
                        .param("professionalId", fixture.professional().getId().toString())
                        .param("serviceId", fixture.service().getId().toString())
                        .param("date", "2027-05-25"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void allServicesProfessionalReturnsAvailability() throws Exception {
        Fixture fixture = fixture("availability-all-services", 60);
        String token = registerClient("availability.all.services.viewer@email.com");

        mockMvc.perform(get("/api/availability")
                        .header("Authorization", "Bearer " + token)
                        .param("professionalId", fixture.professional().getId().toString())
                        .param("serviceId", fixture.service().getId().toString())
                        .param("date", "2027-05-24"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isNotEmpty());
    }

    @Test
    void selectedServicesProfessionalReturnsAvailabilityForAssignedService() throws Exception {
        Fixture fixture = fixture("availability-selected-assigned", 60);
        String token = registerClient("availability.selected.assigned.viewer@email.com");
        fixture.professional().setSelectedServices();
        professionalRepository.save(fixture.professional());
        professionalServiceRepository.save(new ProfessionalServiceAssignment(fixture.professional(), fixture.service()));

        mockMvc.perform(get("/api/availability")
                        .header("Authorization", "Bearer " + token)
                        .param("professionalId", fixture.professional().getId().toString())
                        .param("serviceId", fixture.service().getId().toString())
                        .param("date", "2027-05-24"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isNotEmpty());
    }

    @Test
    void selectedServicesProfessionalReturnsEmptyAvailabilityForUnassignedService() throws Exception {
        Fixture fixture = fixture("availability-selected-unassigned", 60);
        String token = registerClient("availability.selected.unassigned.viewer@email.com");
        fixture.professional().setSelectedServices();
        professionalRepository.save(fixture.professional());

        mockMvc.perform(get("/api/availability")
                        .header("Authorization", "Bearer " + token)
                        .param("professionalId", fixture.professional().getId().toString())
                        .param("serviceId", fixture.service().getId().toString())
                        .param("date", "2027-05-24"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void pastSlotsAreNotReturned() throws Exception {
        Fixture fixture = fixture("availability-past", 60, LocalDate.now().getDayOfWeek(), LocalTime.of(0, 0), LocalTime.of(2, 0));
        String token = registerClient("availability.past.viewer@email.com");

        mockMvc.perform(get("/api/availability")
                        .header("Authorization", "Bearer " + token)
                        .param("professionalId", fixture.professional().getId().toString())
                        .param("serviceId", fixture.service().getId().toString())
                        .param("date", LocalDate.now().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    private Fixture fixture(String suffix, int durationMinutes) {
        return fixture(suffix, durationMinutes, DayOfWeek.MONDAY);
    }

    private Fixture fixture(String suffix, int durationMinutes, DayOfWeek dayOfWeek) {
        return fixture(suffix, durationMinutes, dayOfWeek, LocalTime.of(9, 0), LocalTime.of(17, 0));
    }

    private Fixture fixture(String suffix, int durationMinutes, DayOfWeek dayOfWeek, LocalTime startTime, LocalTime endTime) {
        Professional professional = professionalRepository.save(new Professional(
                "Professional " + suffix,
                suffix + ".professional@email.com",
                "123"
        ));
        Service service = serviceRepository.save(new Service(
                "Service " + suffix,
                null,
                durationMinutes,
                BigDecimal.valueOf(1000)
        ));
        businessHoursRepository.save(new BusinessHours(
                professional,
                dayOfWeek,
                startTime,
                endTime
        ));
        return new Fixture(professional, service);
    }

    private java.util.List<String> startTimes(JsonNode slots) {
        java.util.List<String> values = new java.util.ArrayList<>();
        slots.forEach(slot -> values.add(slot.get("startDateTime").asText()));
        return values;
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

    private record Fixture(Professional professional, Service service) {
    }
}
