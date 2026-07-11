package com.turnos.api.appointments;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.turnos.api.availability.AvailabilityBlock;
import com.turnos.api.availability.AvailabilityBlockRepository;
import com.turnos.api.availability.AvailabilityBlockType;
import com.turnos.api.availability.BusinessHours;
import com.turnos.api.availability.BusinessHoursRepository;
import com.turnos.api.notifications.NotificationService;
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
import org.springframework.boot.test.mock.mockito.MockBean;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AppointmentControllerTest {

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
    private AvailabilityBlockRepository availabilityBlockRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private NotificationService notificationService;

    @Test
    void clientCreatesPendingAppointment() throws Exception {
        Fixture fixture = fixture("client-pending");
        String clientToken = registerClient("client.pending@email.com");
        clearInvocations(notificationService);

        mockMvc.perform(post("/api/appointments")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "professionalId": %d,
                                  "serviceId": %d,
                                  "startDateTime": "2027-05-24T10:00:00",
                                  "notes": "First visit"
                                }
                                """.formatted(fixture.professional().getId(), fixture.service().getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.createdByRole").value("CLIENT"))
                .andExpect(jsonPath("$.endDateTime").value("2027-05-24T10:30:00"));

        verify(notificationService).appointmentRequested(any(Appointment.class));
    }

    @Test
    void adminCreatesConfirmedAppointment() throws Exception {
        Fixture fixture = fixture("admin-confirmed");
        User client = createClient("admin.created.client@email.com");
        String adminToken = login("admin@turnos.local", "admin1234");
        clearInvocations(notificationService);

        mockMvc.perform(post("/api/appointments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "clientId": %d,
                                  "professionalId": %d,
                                  "serviceId": %d,
                                  "startDateTime": "2027-05-24T10:00:00"
                                }
                                """.formatted(client.getId(), fixture.professional().getId(), fixture.service().getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.createdByRole").value("ADMIN"))
                .andExpect(jsonPath("$.confirmedAt").exists());

        verify(notificationService).appointmentCreatedByAdmin(any(Appointment.class));
    }

    @Test
    void clientCannotCreateAppointmentForServiceThatIsNotOnlineBookable() throws Exception {
        Fixture fixture = fixture("client-not-online-bookable", false, false);
        String clientToken = registerClient("client.not.online.bookable@email.com");

        mockMvc.perform(post("/api/appointments")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "professionalId": %d,
                                  "serviceId": %d,
                                  "startDateTime": "2027-05-24T10:00:00"
                                }
                                """.formatted(fixture.professional().getId(), fixture.service().getId())))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Service is not available for online booking"));
    }

    @Test
    void adminCanCreateAppointmentForServiceThatIsNotOnlineBookable() throws Exception {
        Fixture fixture = fixture("admin-not-online-bookable", false, false);
        User client = createClient("admin.not.online.bookable.client@email.com");
        String adminToken = login("admin@turnos.local", "admin1234");

        mockMvc.perform(post("/api/appointments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "clientId": %d,
                                  "professionalId": %d,
                                  "serviceId": %d,
                                  "startDateTime": "2027-05-24T10:00:00"
                                }
                                """.formatted(client.getId(), fixture.professional().getId(), fixture.service().getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.createdByRole").value("ADMIN"));
    }

    @Test
    void rejectsAppointmentOutsideBusinessHours() throws Exception {
        Fixture fixture = fixture("outside-hours");
        String clientToken = registerClient("outside.hours.client@email.com");

        mockMvc.perform(post("/api/appointments")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "professionalId": %d,
                                  "serviceId": %d,
                                  "startDateTime": "2027-05-24T18:00:00"
                                }
                                """.formatted(fixture.professional().getId(), fixture.service().getId())))
                .andExpect(status().isConflict());
    }

    @Test
    void rejectsOverlappingAppointment() throws Exception {
        Fixture fixture = fixture("overlap-appointment");
        String firstClientToken = registerClient("first.overlap.client@email.com");
        String secondClientToken = registerClient("second.overlap.client@email.com");

        createClientAppointment(firstClientToken, fixture, "2027-05-24T10:00:00");

        mockMvc.perform(post("/api/appointments")
                        .header("Authorization", "Bearer " + secondClientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "professionalId": %d,
                                  "serviceId": %d,
                                  "startDateTime": "2027-05-24T10:15:00"
                                }
                                """.formatted(fixture.professional().getId(), fixture.service().getId())))
                .andExpect(status().isConflict());
    }

    @Test
    void rejectsAppointmentOverAvailabilityBlock() throws Exception {
        Fixture fixture = fixture("block-overlap");
        String clientToken = registerClient("block.overlap.client@email.com");
        availabilityBlockRepository.save(new AvailabilityBlock(
                fixture.professional(),
                LocalDateTime.of(2027, 5, 24, 11, 0),
                LocalDateTime.of(2027, 5, 24, 12, 0),
                "Unavailable",
                AvailabilityBlockType.MANUAL_BLOCK
        ));

        mockMvc.perform(post("/api/appointments")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "professionalId": %d,
                                  "serviceId": %d,
                                  "startDateTime": "2027-05-24T11:15:00"
                                }
                                """.formatted(fixture.professional().getId(), fixture.service().getId())))
                .andExpect(status().isConflict());
    }

    @Test
    void clientCanCreateAppointmentWhenSelectedServiceIsAssigned() throws Exception {
        Fixture fixture = fixture("client-compatible");
        String clientToken = registerClient("client.compatible@email.com");
        fixture.professional().setSelectedServices();
        professionalRepository.save(fixture.professional());
        professionalServiceRepository.save(new ProfessionalServiceAssignment(fixture.professional(), fixture.service()));

        mockMvc.perform(post("/api/appointments")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "professionalId": %d,
                                  "serviceId": %d,
                                  "startDateTime": "2027-05-24T10:00:00"
                                }
                                """.formatted(fixture.professional().getId(), fixture.service().getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void clientCannotCreateAppointmentWhenSelectedServiceIsNotAssigned() throws Exception {
        Fixture fixture = fixture("client-incompatible");
        String clientToken = registerClient("client.incompatible@email.com");
        fixture.professional().setSelectedServices();
        professionalRepository.save(fixture.professional());

        mockMvc.perform(post("/api/appointments")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "professionalId": %d,
                                  "serviceId": %d,
                                  "startDateTime": "2027-05-24T10:00:00"
                                }
                                """.formatted(fixture.professional().getId(), fixture.service().getId())))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Professional does not provide the selected service"));
    }

    @Test
    void adminCannotCreateAppointmentWhenSelectedServiceIsNotAssigned() throws Exception {
        Fixture fixture = fixture("admin-incompatible");
        User client = createClient("admin.incompatible.client@email.com");
        String adminToken = login("admin@turnos.local", "admin1234");
        fixture.professional().setSelectedServices();
        professionalRepository.save(fixture.professional());

        mockMvc.perform(post("/api/appointments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "clientId": %d,
                                  "professionalId": %d,
                                  "serviceId": %d,
                                  "startDateTime": "2027-05-24T10:00:00"
                                }
                                """.formatted(client.getId(), fixture.professional().getId(), fixture.service().getId())))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Professional does not provide the selected service"));
    }

    @Test
    void adminCanConfirmCompleteAndInvalidTransitionIsRejected() throws Exception {
        Fixture fixture = fixture("transitions");
        String clientToken = registerClient("transition.client@email.com");
        String adminToken = login("admin@turnos.local", "admin1234");
        Long appointmentId = createClientAppointment(clientToken, fixture, "2027-05-24T10:00:00");
        clearInvocations(notificationService);

        mockMvc.perform(patch("/api/appointments/{id}/confirm", appointmentId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.confirmedAt").exists());
        verify(notificationService).appointmentConfirmed(any(Appointment.class));

        mockMvc.perform(patch("/api/appointments/{id}/complete", appointmentId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.completedAt").exists());
        verify(notificationService).appointmentCompleted(any(Appointment.class));

        mockMvc.perform(patch("/api/appointments/{id}/confirm", appointmentId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isConflict());
    }

    @Test
    void clientCanCancelOwnAppointment() throws Exception {
        Fixture fixture = fixture("client-cancel");
        String clientToken = registerClient("cancel.client@email.com");
        Long appointmentId = createClientAppointment(clientToken, fixture, "2027-05-24T10:00:00");
        clearInvocations(notificationService);

        mockMvc.perform(patch("/api/appointments/{id}/cancel-by-client", appointmentId)
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "reason": "Cannot attend"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELED_BY_CLIENT"))
                .andExpect(jsonPath("$.canceledAt").exists());

        verify(notificationService).appointmentCanceledByClient(any(Appointment.class));
    }

    @Test
    void adminCanRejectCancelAndMarkNoShow() throws Exception {
        Fixture rejectFixture = fixture("admin-reject");
        Fixture cancelFixture = fixture("admin-cancel");
        Fixture noShowFixture = fixture("admin-no-show");
        String adminToken = login("admin@turnos.local", "admin1234");
        String rejectClientToken = registerClient("reject.client@email.com");
        User cancelClient = createClient("cancel.by.admin.client@email.com");
        User noShowClient = createClient("no.show.client@email.com");

        Long pendingId = createClientAppointment(rejectClientToken, rejectFixture, "2027-05-24T10:00:00");
        Long confirmedCancelId = createAdminAppointment(adminToken, cancelClient, cancelFixture, "2027-05-24T10:00:00");
        Long confirmedNoShowId = createAdminAppointment(adminToken, noShowClient, noShowFixture, "2027-05-24T10:00:00");
        clearInvocations(notificationService);

        mockMvc.perform(patch("/api/appointments/{id}/reject", pendingId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "reason": "No availability"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.rejectionReason").value("No availability"));
        verify(notificationService).appointmentRejected(any(Appointment.class));

        mockMvc.perform(patch("/api/appointments/{id}/cancel-by-admin", confirmedCancelId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "reason": "Professional unavailable"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELED_BY_ADMIN"))
                .andExpect(jsonPath("$.canceledAt").exists());
        verify(notificationService).appointmentCanceledByAdmin(any(Appointment.class));

        mockMvc.perform(patch("/api/appointments/{id}/no-show", confirmedNoShowId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("NO_SHOW"))
                .andExpect(jsonPath("$.noShowAt").exists());
        verify(notificationService).appointmentMarkedNoShow(any(Appointment.class));
    }

    private Fixture fixture(String suffix) {
        return fixture(suffix, true, false);
    }

    private Fixture fixture(String suffix, boolean onlineBookable, boolean requiresEvaluation) {
        Professional professional = professionalRepository.save(new Professional(
                "Professional " + suffix,
                suffix + ".professional@email.com",
                "123"
        ));
        Service service = serviceRepository.save(new Service(
                "Service " + suffix,
                null,
                30,
                BigDecimal.valueOf(1000),
                null,
                onlineBookable,
                requiresEvaluation
        ));
        businessHoursRepository.save(new BusinessHours(
                professional,
                DayOfWeek.MONDAY,
                LocalTime.of(9, 0),
                LocalTime.of(17, 0)
        ));
        return new Fixture(professional, service);
    }

    private Long createClientAppointment(String token, Fixture fixture, String startDateTime) throws Exception {
        String response = mockMvc.perform(post("/api/appointments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "professionalId": %d,
                                  "serviceId": %d,
                                  "startDateTime": "%s"
                                }
                                """.formatted(fixture.professional().getId(), fixture.service().getId(), startDateTime)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).get("id").asLong();
    }

    private Long createAdminAppointment(String token, User client, Fixture fixture, String startDateTime) throws Exception {
        String response = mockMvc.perform(post("/api/appointments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "clientId": %d,
                                  "professionalId": %d,
                                  "serviceId": %d,
                                  "startDateTime": "%s"
                                }
                                """.formatted(client.getId(), fixture.professional().getId(), fixture.service().getId(), startDateTime)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).get("id").asLong();
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

    private record Fixture(Professional professional, Service service) {
    }
}
