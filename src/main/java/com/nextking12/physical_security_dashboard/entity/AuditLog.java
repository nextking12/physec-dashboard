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
@Table(name = "audit_logs")
public class AuditLog {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 64)
	private String username;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 32)
	private AuditAction action;

	@Column(nullable = false, length = 64)
	private String entityType;

	private Long entityId;

	@Column(columnDefinition = "TEXT")
	private String details;

	@Column(nullable = false)
	private Instant occurredAt = Instant.now();

}
