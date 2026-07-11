package com.turnos.api.professionals;

import com.turnos.api.common.ConflictException;
import com.turnos.api.common.ResourceNotFoundException;
import com.turnos.api.services.Service;
import com.turnos.api.services.ServiceRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class ProfessionalServiceAssignmentServiceTest {

    @Autowired
    private ProfessionalRepository professionalRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private ProfessionalServiceRepository professionalServiceRepository;

    @Autowired
    private ProfessionalServiceAssignmentService assignmentService;

    @Test
    void allServicesProfessionalCanProvideActiveServices() {
        Professional professional = professionalRepository.save(new Professional(
                "All Services Pro",
                "all.services.pro@email.com",
                "123"
        ));
        Service service = serviceRepository.save(new Service(
                "All Services Service",
                null,
                30,
                BigDecimal.valueOf(1000)
        ));

        assertThat(assignmentService.canProfessionalProvideService(professional.getId(), service.getId())).isTrue();
        assertThat(assignmentService.findServicesForProfessional(professional.getId()))
                .extracting(Service::getId)
                .contains(service.getId());
        assertThat(assignmentService.findProfessionalsForService(service.getId()))
                .extracting(Professional::getId)
                .contains(professional.getId());
    }

    @Test
    void selectedServicesProfessionalCanOnlyProvideAssignedServices() {
        Professional professional = professionalRepository.save(new Professional(
                "Selected Services Pro",
                "selected.services.pro@email.com",
                "123"
        ));
        Service assignedService = serviceRepository.save(new Service(
                "Assigned Service",
                null,
                30,
                BigDecimal.valueOf(1000)
        ));
        Service unassignedService = serviceRepository.save(new Service(
                "Unassigned Service",
                null,
                30,
                BigDecimal.valueOf(1000)
        ));

        professional.setSelectedServices();
        professionalRepository.save(professional);
        professionalServiceRepository.save(new ProfessionalServiceAssignment(professional, assignedService));

        assertThat(assignmentService.canProfessionalProvideService(professional.getId(), assignedService.getId())).isTrue();
        assertThat(assignmentService.canProfessionalProvideService(professional.getId(), unassignedService.getId())).isFalse();
        assertThat(assignmentService.findServicesForProfessional(professional.getId()))
                .extracting(Service::getId)
                .containsExactly(assignedService.getId());
        assertThat(assignmentService.findProfessionalsForService(assignedService.getId()))
                .extracting(Professional::getId)
                .contains(professional.getId());
        assertThat(assignmentService.findProfessionalsForService(unassignedService.getId()))
                .extracting(Professional::getId)
                .doesNotContain(professional.getId());
    }

    @Test
    void selectedServicesProfessionalWithoutAssignmentsCannotProvideService() {
        Professional professional = professionalRepository.save(new Professional(
                "No Assignments Pro",
                "no.assignments.pro@email.com",
                "123"
        ));
        Service service = serviceRepository.save(new Service(
                "No Assignments Service",
                null,
                30,
                BigDecimal.valueOf(1000)
        ));

        professional.setSelectedServices();
        professionalRepository.save(professional);

        assertThat(assignmentService.canProfessionalProvideService(professional.getId(), service.getId())).isFalse();
        assertThatThrownBy(() -> assignmentService.ensureProfessionalProvidesService(professional.getId(), service.getId()))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Professional does not provide the selected service");
    }

    @Test
    void inactiveProfessionalsOrServicesCannotProvideService() {
        Professional inactiveProfessional = professionalRepository.save(new Professional(
                "Inactive Pro",
                "inactive.pro@email.com",
                "123"
        ));
        Professional activeProfessional = professionalRepository.save(new Professional(
                "Active Pro",
                "active.pro@email.com",
                "123"
        ));
        Service activeService = serviceRepository.save(new Service(
                "Active Service",
                null,
                30,
                BigDecimal.valueOf(1000)
        ));
        Service inactiveService = serviceRepository.save(new Service(
                "Inactive Service",
                null,
                30,
                BigDecimal.valueOf(1000)
        ));

        inactiveProfessional.deactivate();
        inactiveService = serviceRepository.findById(inactiveService.getId()).orElseThrow();
        inactiveService.deactivate();
        professionalRepository.save(inactiveProfessional);
        serviceRepository.save(inactiveService);

        assertThat(assignmentService.canProfessionalProvideService(inactiveProfessional.getId(), activeService.getId())).isFalse();
        assertThat(assignmentService.canProfessionalProvideService(activeProfessional.getId(), inactiveService.getId())).isFalse();
    }

    @Test
    void missingProfessionalOrServiceThrowsNotFound() {
        Professional professional = professionalRepository.save(new Professional(
                "Missing Lookup Pro",
                "missing.lookup.pro@email.com",
                "123"
        ));
        Service service = serviceRepository.save(new Service(
                "Missing Lookup Service",
                null,
                30,
                BigDecimal.valueOf(1000)
        ));

        assertThatThrownBy(() -> assignmentService.canProfessionalProvideService(999_999L, service.getId()))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Professional not found with id: 999999");
        assertThatThrownBy(() -> assignmentService.canProfessionalProvideService(professional.getId(), 999_999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Service not found with id: 999999");
    }
}
