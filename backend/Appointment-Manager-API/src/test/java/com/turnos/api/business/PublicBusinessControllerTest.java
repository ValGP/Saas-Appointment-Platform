package com.turnos.api.business;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.turnos.api.appointments.PublicBookingRequest;
import com.turnos.api.availability.BusinessHours;
import com.turnos.api.availability.BusinessHoursRepository;
import com.turnos.api.professionals.Professional;
import com.turnos.api.professionals.ProfessionalRepository;
import com.turnos.api.services.Service;
import com.turnos.api.services.ServiceRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

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
@Transactional
class PublicBusinessControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private BusinessRepository businessRepository;

    @Autowired
    private ProfessionalRepository professionalRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private BusinessHoursRepository businessHoursRepository;

    @Test
    void canGetPublicBusinessConfig() throws Exception {
        mockMvc.perform(get("/api/public/businesses/bibe"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slug").value("bibe"))
                .andExpect(jsonPath("$.name").value("BIBE Estetica"));
    }

    @Test
    void canBookAppointmentPublicly() throws Exception {
        Business business = businessRepository.findById(1L).orElseThrow();

        // 1. Create professional
        Professional prof = new Professional(business, "Test Prof", "test.prof@bibe.com", "123456");
        prof = professionalRepository.save(prof);

        // 2. Create service
        Service svc = new Service(business, "Test Service", "Desc", 30, new BigDecimal("100.00"));
        svc = serviceRepository.save(svc);

        // 3. Create business hours
        LocalDateTime appointmentTime = LocalDateTime.now().plusDays(2).withHour(10).withMinute(0).withSecond(0).withNano(0);
        DayOfWeek dayOfWeek = appointmentTime.getDayOfWeek();
        BusinessHours hours = new BusinessHours(business, prof, dayOfWeek, LocalTime.of(8, 0), LocalTime.of(18, 0));
        businessHoursRepository.save(hours);

        // 4. Perform public booking
        PublicBookingRequest request = new PublicBookingRequest(
                svc.getId(),
                prof.getId(),
                appointmentTime,
                "Guest Name",
                "guest@gmail.com",
                "999999",
                "Some guest notes"
        );

        mockMvc.perform(post("/api/public/appointments")
                        .header("X-Business-Slug", "bibe")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.clientName").value("Guest Name"))
                .andExpect(jsonPath("$.serviceName").value("Test Service"))
                .andExpect(jsonPath("$.publicUuid").exists());
    }
}
