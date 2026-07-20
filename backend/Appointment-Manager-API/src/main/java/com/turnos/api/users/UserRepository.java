package com.turnos.api.users;

import com.turnos.api.business.Business;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailAndBusiness(String email, Business business);

    Optional<User> findByIdAndRole(Long id, UserRole role);

    List<User> findByRole(UserRole role);

    boolean existsByEmail(String email);

    boolean existsByEmailAndBusiness(String email, Business business);
}
