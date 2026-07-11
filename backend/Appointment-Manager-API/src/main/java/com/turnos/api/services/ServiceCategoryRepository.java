package com.turnos.api.services;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ServiceCategoryRepository extends JpaRepository<ServiceCategory, Long> {

    boolean existsBySlugIgnoreCase(String slug);

    boolean existsBySlugIgnoreCaseAndIdNot(String slug, Long id);

    List<ServiceCategory> findAllByOrderByDisplayOrderAscNameAsc();

    Optional<ServiceCategory> findFirstBySlugIgnoreCase(String slug);
}
