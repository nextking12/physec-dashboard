package com.nextking12.physical_security_dashboard.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "users")
public class User {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true, length = 64)
	private String username;

	@Column(nullable = false)
	private String passwordHash;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 32)
	private UserRole role;

	@Column(nullable = false)
	private Instant createdAt = Instant.now();

}
