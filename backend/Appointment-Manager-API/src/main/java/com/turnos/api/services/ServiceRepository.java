package com.turnos.api.services;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceRepository extends JpaRepository<Service, Long> {

    boolean existsByCategory_IdAndActiveTrue(Long categoryId);

    List<Service> findByCategory_Id(Long categoryId);
}
