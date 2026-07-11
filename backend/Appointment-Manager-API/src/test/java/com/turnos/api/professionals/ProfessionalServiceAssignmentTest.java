package com.turnos.api.professionals;

import com.turnos.api.services.Service;
import com.turnos.api.services.ServiceRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class ProfessionalServiceAssignmentTest {

    @Autowired
    private ProfessionalRepository professionalRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private ProfessionalServiceRepository professionalServiceRepository;

    @Test
    void persistsProfessionalServiceAssignment() {
        Professional professional = professionalRepository.save(new Professional(
                "Assignment Pro",
                "assignment.pro@email.com",
                "123"
        ));
        Service service = serviceRepository.save(new Service(
                "Assignment Service",
                "Service for assignment mapping",
                30,
                BigDecimal.valueOf(1000)
        ));

        professional.setSelectedServices();
        professionalRepository.save(professional);
        professionalServiceRepository.save(new ProfessionalServiceAssignment(professional, service));

        assertThat(professionalServiceRepository.existsByProfessional_IdAndService_Id(
                professional.getId(),
                service.getId()
        )).isTrue();
        assertThat(professionalServiceRepository.findByProfessional_Id(professional.getId())).hasSize(1);
        assertThat(professionalServiceRepository.findByService_Id(service.getId())).hasSize(1);
    }
}
