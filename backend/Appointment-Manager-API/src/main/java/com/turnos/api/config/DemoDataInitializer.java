package com.turnos.api.config;

import com.turnos.api.availability.BusinessHours;
import com.turnos.api.availability.BusinessHoursRepository;
import com.turnos.api.professionals.Professional;
import com.turnos.api.professionals.ProfessionalRepository;
import com.turnos.api.services.Service;
import com.turnos.api.services.ServiceRepository;
import com.turnos.api.users.User;
import com.turnos.api.users.UserRepository;
import com.turnos.api.users.UserRole;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Arrays;

@Profile("dev")
@org.springframework.stereotype.Component
@ConditionalOnProperty(prefix = "app.demo-data", name = "enabled", havingValue = "true")
public class DemoDataInitializer implements CommandLineRunner {

    private static final String CLIENT_EMAIL = "demo.client@turnos.local";
    private static final String PROFESSIONAL_EMAIL = "demo.professional@turnos.local";
    private static final String SERVICE_NAME = "Demo Consultation";

    private final UserRepository userRepository;
    private final ServiceRepository serviceRepository;
    private final ProfessionalRepository professionalRepository;
    private final BusinessHoursRepository businessHoursRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoDataInitializer(
            UserRepository userRepository,
            ServiceRepository serviceRepository,
            ProfessionalRepository professionalRepository,
            BusinessHoursRepository businessHoursRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.serviceRepository = serviceRepository;
        this.professionalRepository = professionalRepository;
        this.businessHoursRepository = businessHoursRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        createClient();
        findOrCreateService();
        Professional professional = findOrCreateProfessional();
        createBusinessHours(professional);
    }

    private void createClient() {
        if (userRepository.existsByEmail(CLIENT_EMAIL)) {
            return;
        }

        User client = new User(
                "Demo Client",
                CLIENT_EMAIL,
                passwordEncoder.encode("client1234"),
                "555-0101",
                UserRole.CLIENT
        );

        userRepository.save(client);
    }

    private Service findOrCreateService() {
        return serviceRepository.findAll().stream()
                .filter(service -> SERVICE_NAME.equalsIgnoreCase(service.getName()))
                .findFirst()
                .orElseGet(() -> serviceRepository.save(new Service(
                        SERVICE_NAME,
                        "General demo appointment",
                        30,
                        new BigDecimal("15000.00")
                )));
    }

    private Professional findOrCreateProfessional() {
        return professionalRepository.findByEmail(PROFESSIONAL_EMAIL)
                .orElseGet(() -> professionalRepository.save(new Professional(
                        "Demo Professional",
                        PROFESSIONAL_EMAIL,
                        "555-0202"
                )));
    }

    private void createBusinessHours(Professional professional) {
        Arrays.stream(DayOfWeek.values())
                .filter(day -> day != DayOfWeek.SATURDAY && day != DayOfWeek.SUNDAY)
                .forEach(day -> createBusinessHoursForDay(professional, day));
    }

    private void createBusinessHoursForDay(Professional professional, DayOfWeek day) {
        LocalTime startTime = LocalTime.of(9, 0);
        LocalTime endTime = LocalTime.of(17, 0);

        boolean alreadyExists = businessHoursRepository
                .findByProfessionalIdAndDayOfWeekAndActiveTrue(professional.getId(), day)
                .stream()
                .anyMatch(hours -> hours.getStartTime().equals(startTime) && hours.getEndTime().equals(endTime));

        if (!alreadyExists) {
            businessHoursRepository.save(new BusinessHours(professional, day, startTime, endTime));
        }
    }
}
