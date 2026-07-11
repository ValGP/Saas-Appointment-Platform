package com.turnos.api.professionals;

import com.turnos.api.common.ConflictException;
import com.turnos.api.common.ResourceNotFoundException;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@org.springframework.stereotype.Service
public class ProfessionalService {

    private final ProfessionalRepository professionalRepository;

    public ProfessionalService(ProfessionalRepository professionalRepository) {
        this.professionalRepository = professionalRepository;
    }

    @Transactional
    public ProfessionalResponse create(ProfessionalRequest request) {
        String email = request.email().toLowerCase();
        if (professionalRepository.existsByEmail(email)) {
            throw new ConflictException("Professional email already registered: " + email);
        }

        Professional professional = new Professional(request.fullName(), email, request.phone());
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
}
