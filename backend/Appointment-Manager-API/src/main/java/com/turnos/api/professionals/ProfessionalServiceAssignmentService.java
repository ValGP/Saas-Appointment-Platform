package com.turnos.api.professionals;

import com.turnos.api.common.ConflictException;
import com.turnos.api.common.ResourceNotFoundException;
import com.turnos.api.services.Service;
import com.turnos.api.services.ServiceRepository;
import org.springframework.transaction.annotation.Transactional;
import com.turnos.api.availability.BusinessHoursRepository;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@org.springframework.stereotype.Service
public class ProfessionalServiceAssignmentService {

    private static final String INCOMPATIBLE_SERVICE_MESSAGE = "Professional does not provide the selected service";

    private final ProfessionalRepository professionalRepository;
    private final ServiceRepository serviceRepository;
    private final ProfessionalServiceRepository professionalServiceRepository;
    private final BusinessHoursRepository businessHoursRepository;

    public ProfessionalServiceAssignmentService(
            ProfessionalRepository professionalRepository,
            ServiceRepository serviceRepository,
            ProfessionalServiceRepository professionalServiceRepository,
            BusinessHoursRepository businessHoursRepository
    ) {
        this.professionalRepository = professionalRepository;
        this.serviceRepository = serviceRepository;
        this.professionalServiceRepository = professionalServiceRepository;
        this.businessHoursRepository = businessHoursRepository;
    }

    @Transactional(readOnly = true)
    public boolean canProfessionalProvideService(Long professionalId, Long serviceId) {
        Professional professional = getProfessional(professionalId);
        Service service = getService(serviceId);

        return professional.canAttendAppointments()
                && service.canBeBooked()
                && isServiceAssignedToProfessional(professional, service);
    }

    @Transactional(readOnly = true)
    public void ensureProfessionalProvidesService(Long professionalId, Long serviceId) {
        if (!canProfessionalProvideService(professionalId, serviceId)) {
            throw new ConflictException(INCOMPATIBLE_SERVICE_MESSAGE);
        }
    }

    @Transactional(readOnly = true)
    public ProfessionalServicesAssignmentResponse findServicesAssignmentForProfessional(Long professionalId) {
        Professional professional = getProfessional(professionalId);

        List<Service> services = professional.usesSelectedServices()
                ? findSelectedServicesForProfessional(professionalId)
                : List.of();

        return ProfessionalServicesAssignmentResponse.from(professional, services);
    }

    @Transactional
    public ProfessionalServicesAssignmentResponse assignServicesToProfessional(
            Long professionalId,
            ProfessionalServicesAssignmentRequest request
    ) {
        Professional professional = getProfessional(professionalId);

        if (request.mode() == ServiceAssignmentMode.ALL_SERVICES) {
            professional.setAllServices();
            professionalServiceRepository.deleteByProfessional_Id(professionalId);
            return ProfessionalServicesAssignmentResponse.from(professional, List.of());
        }

        List<Service> services = getServices(request.serviceIds());
        professional.setSelectedServices();
        professionalServiceRepository.deleteByProfessional_Id(professionalId);
        services.stream()
                .map(service -> new ProfessionalServiceAssignment(professional, service))
                .forEach(professionalServiceRepository::save);

        return ProfessionalServicesAssignmentResponse.from(professional, services);
    }

    @Transactional(readOnly = true)
    public ServiceProfessionalsAssignmentResponse findProfessionalsAssignmentForService(Long serviceId) {
        getService(serviceId);
        List<Professional> professionals = findProfessionalsForService(serviceId);

        return ServiceProfessionalsAssignmentResponse.from(
                serviceId,
                resolveServiceProfessionalAssignmentMode(serviceId),
                professionals
        );
    }

    @Transactional
    public ServiceProfessionalsAssignmentResponse assignProfessionalsToService(
            Long serviceId,
            ServiceProfessionalsAssignmentRequest request
    ) {
        Service service = getService(serviceId);

        if (request.mode() == ServiceProfessionalAssignmentMode.ALL_PROFESSIONALS) {
            professionalRepository.findAll().stream()
                    .filter(Professional::usesSelectedServices)
                    .forEach(professional -> ensureAssignment(professional, service));
        } else {
            Set<Long> selectedProfessionalIds = getUniqueIds(request.professionalIds());
            List<Professional> selectedProfessionals = getProfessionals(selectedProfessionalIds);
            Set<Long> validSelectedIds = selectedProfessionals.stream()
                    .map(Professional::getId)
                    .collect(java.util.stream.Collectors.toSet());

            List<Service> otherServices = serviceRepository.findAll().stream()
                    .filter(existingService -> !existingService.getId().equals(serviceId))
                    .toList();

            professionalRepository.findAll().forEach(professional -> {
                if (validSelectedIds.contains(professional.getId())) {
                    if (professional.usesSelectedServices()) {
                        ensureAssignment(professional, service);
                    }
                    return;
                }

                if (professional.attendsAllServices()) {
                    professional.setSelectedServices();
                    otherServices.forEach(otherService -> ensureAssignment(professional, otherService));
                }
                professionalServiceRepository.deleteByProfessional_IdAndService_Id(professional.getId(), serviceId);
            });
        }

        return findProfessionalsAssignmentForService(serviceId);
    }

    @Transactional(readOnly = true)
    public List<Service> findServicesForProfessional(Long professionalId) {
        Professional professional = getProfessional(professionalId);

        if (professional.attendsAllServices()) {
            return serviceRepository.findAll();
        }

        return professionalServiceRepository.findByProfessional_Id(professionalId).stream()
                .map(ProfessionalServiceAssignment::getService)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Professional> findProfessionalsForService(Long serviceId) {
        getService(serviceId);

        return professionalRepository.findAll().stream()
                .filter(professional -> professional.attendsAllServices()
                        || professionalServiceRepository.existsByProfessional_IdAndService_Id(
                        professional.getId(),
                        serviceId
                ))
                .toList();
    }

    private boolean isServiceAssignedToProfessional(Professional professional, Service service) {
        if (professional.attendsAllServices()) {
            return true;
        }

        return professionalServiceRepository.existsByProfessional_IdAndService_Id(
                professional.getId(),
                service.getId()
        );
    }

    private List<Service> findSelectedServicesForProfessional(Long professionalId) {
        return professionalServiceRepository.findByProfessional_Id(professionalId).stream()
                .map(ProfessionalServiceAssignment::getService)
                .toList();
    }

    private List<Service> getServices(List<Long> serviceIds) {
        Set<Long> uniqueServiceIds = getUniqueIds(serviceIds);

        return uniqueServiceIds.stream()
                .map(this::getService)
                .toList();
    }

    private List<Professional> getProfessionals(Set<Long> professionalIds) {
        return professionalIds.stream()
                .map(this::getProfessional)
                .toList();
    }

    private Set<Long> getUniqueIds(List<Long> ids) {
        return new LinkedHashSet<>(ids == null ? List.of() : ids);
    }

    private void ensureAssignment(Professional professional, Service service) {
        if (!professionalServiceRepository.existsByProfessional_IdAndService_Id(
                professional.getId(),
                service.getId()
        )) {
            professionalServiceRepository.save(new ProfessionalServiceAssignment(professional, service));
        }
    }

    private ServiceProfessionalAssignmentMode resolveServiceProfessionalAssignmentMode(Long serviceId) {
        boolean allProfessionalsProvideService = professionalRepository.findAll().stream()
                .allMatch(professional -> professional.attendsAllServices()
                        || professionalServiceRepository.existsByProfessional_IdAndService_Id(
                        professional.getId(),
                        serviceId
                ));

        return allProfessionalsProvideService
                ? ServiceProfessionalAssignmentMode.ALL_PROFESSIONALS
                : ServiceProfessionalAssignmentMode.SELECTED_PROFESSIONALS;
    }

    private Professional getProfessional(Long professionalId) {
        return professionalRepository.findById(professionalId)
                .orElseThrow(() -> new ResourceNotFoundException("Professional", professionalId));
    }

    private Service getService(Long serviceId) {
        return serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Service", serviceId));
    }

    @Transactional(readOnly = true)
    public boolean hasBusinessHours(Long professionalId) {
        return businessHoursRepository.existsByProfessionalIdAndActiveTrue(professionalId);
    }
}
