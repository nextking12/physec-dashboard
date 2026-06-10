package com.nextking12.physical_security_dashboard.repository;

import com.nextking12.physical_security_dashboard.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

	Optional<User> findByUsername(String username);

}
