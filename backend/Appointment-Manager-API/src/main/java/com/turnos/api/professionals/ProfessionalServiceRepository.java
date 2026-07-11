package com.turnos.api.professionals;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ProfessionalServiceRepository extends JpaRepository<ProfessionalServiceAssignment, ProfessionalServiceId> {

    @EntityGraph(attributePaths = "service")
    List<ProfessionalServiceAssignment> findByProfessional_Id(Long professionalId);

    @EntityGraph(attributePaths = "professional")
    List<ProfessionalServiceAssignment> findByService_Id(Long serviceId);

    boolean existsByProfessional_IdAndService_Id(Long professionalId, Long serviceId);

    @Modifying
    @Query("delete from ProfessionalServiceAssignment assignment where assignment.professional.id = :professionalId")
    void deleteByProfessional_Id(Long professionalId);

    @Modifying
    @Query("delete from ProfessionalServiceAssignment assignment where assignment.professional.id = :professionalId and assignment.service.id = :serviceId")
    void deleteByProfessional_IdAndService_Id(Long professionalId, Long serviceId);
}
