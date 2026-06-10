package com.nextking12.physical_security_dashboard.service;

import com.nextking12.physical_security_dashboard.dto.AuditLogResponse;
import com.nextking12.physical_security_dashboard.entity.AuditAction;
import com.nextking12.physical_security_dashboard.entity.AuditLog;
import com.nextking12.physical_security_dashboard.entity.Device;
import com.nextking12.physical_security_dashboard.repository.AuditLogRepository;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

@Service
public class AuditService {

	private static final String DEVICE_ENTITY_TYPE = "DEVICE";

	private final AuditLogRepository auditLogRepository;

	public AuditService(AuditLogRepository auditLogRepository) {
		this.auditLogRepository = auditLogRepository;
	}

	public void logDeviceAction(AuditAction action, Device device) {
		AuditLog auditLog = new AuditLog();
		auditLog.setUsername(currentUsername());
		auditLog.setAction(action);
		auditLog.setEntityType(DEVICE_ENTITY_TYPE);
		auditLog.setEntityId(device.getId());
		auditLog.setDetails("name=" + device.getName());

		auditLogRepository.save(auditLog);
	}

	public void logDeviceDelete(Long deviceId, String deviceName) {
		AuditLog auditLog = new AuditLog();
		auditLog.setUsername(currentUsername());
		auditLog.setAction(AuditAction.DELETE);
		auditLog.setEntityType(DEVICE_ENTITY_TYPE);
		auditLog.setEntityId(deviceId);
		auditLog.setDetails("name=" + deviceName);

		auditLogRepository.save(auditLog);
	}

	public List<AuditLogResponse> findAll(AuditAction action, String entityType) {
		Specification<AuditLog> spec = (root, query, criteriaBuilder) -> {
			List<Predicate> predicates = new ArrayList<>();

			if (action != null) {
				predicates.add(criteriaBuilder.equal(root.get("action"), action));
			}

			if (entityType != null && !entityType.isBlank()) {
				predicates.add(criteriaBuilder.equal(
						criteriaBuilder.upper(root.get("entityType")),
						entityType.toUpperCase()
				));
			}

			return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
		};

		return auditLogRepository.findAll(spec).stream()
				.sorted((left, right) -> right.getOccurredAt().compareTo(left.getOccurredAt()))
				.map(AuditLogResponse::from)
				.toList();
	}

	private String currentUsername() {
		var authentication = SecurityContextHolder.getContext().getAuthentication();

		if (authentication == null || !authentication.isAuthenticated()) {
			return "unknown";
		}

		return authentication.getName();
	}

}
