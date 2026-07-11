package com.turnos.api.professionals;

import com.turnos.api.business.Business;
import com.turnos.api.business.BusinessRepository;
import com.turnos.api.business.TenantContext;
import com.turnos.api.common.ConflictException;
import com.turnos.api.common.ResourceNotFoundException;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@org.springframework.stereotype.Service
public class ProfessionalService {

    private final ProfessionalRepository professionalRepository;
    private final BusinessRepository businessRepository;

    public ProfessionalService(ProfessionalRepository professionalRepository, BusinessRepository businessRepository) {
        this.professionalRepository = professionalRepository;
        this.businessRepository = businessRepository;
    }

    @Transactional
    public ProfessionalResponse create(ProfessionalRequest request) {
        String email = request.email().toLowerCase();
        if (professionalRepository.existsByEmail(email)) {
            throw new ConflictException("Professional email already registered: " + email);
        }

        Business business = getActiveBusiness();

        Professional professional = new Professional(business, request.fullName(), email, request.phone());
        return ProfessionalResponse.from(professionalRepository.save(professional));
    }

    @Transactional(readOnly = true)
    public List<ProfessionalResponse> findAll() {
        return professionalRepository.findAll().stream()
                .map(ProfessionalResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProfessionalResponse findById(Long id) {
        return ProfessionalResponse.from(getProfessional(id));
    }

    @Transactional
    public ProfessionalResponse update(Long id, ProfessionalRequest request) {
        Professional professional = getProfessional(id);
        String email = request.email().toLowerCase();

        professionalRepository.findByEmail(email)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new ConflictException("Professional email already registered: " + email);
                });

        professional.updateProfile(request.fullName(), email, request.phone());
        return ProfessionalResponse.from(professional);
    }

    @Transactional
    public ProfessionalResponse activate(Long id) {
        Professional professional = getProfessional(id);
        professional.activate();
        return ProfessionalResponse.from(professional);
    }

    @Transactional
    public ProfessionalResponse deactivate(Long id) {
        Professional professional = getProfessional(id);
        professional.deactivate();
        return ProfessionalResponse.from(professional);
    }

    Professional getProfessional(Long id) {
        return professionalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Professional", id));
    }

    private Business getActiveBusiness() {
        Business business = TenantContext.getCurrentTenant();
        if (business == null) {
            return businessRepository.findById(1L)
                    .orElseThrow(() -> new IllegalStateException("Default business with ID 1 must exist"));
        }
        return business;
    }
}
