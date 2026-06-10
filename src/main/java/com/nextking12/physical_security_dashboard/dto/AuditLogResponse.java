package com.nextking12.physical_security_dashboard.dto;

import com.nextking12.physical_security_dashboard.entity.AuditAction;
import com.nextking12.physical_security_dashboard.entity.AuditLog;

import java.time.Instant;

public record AuditLogResponse(
		Long id,
		String username,
		AuditAction action,
		String entityType,
		Long entityId,
		String details,
		Instant occurredAt
) {

	public static AuditLogResponse from(AuditLog auditLog) {
		return new AuditLogResponse(
				auditLog.getId(),
				auditLog.getUsername(),
				auditLog.getAction(),
				auditLog.getEntityType(),
				auditLog.getEntityId(),
				auditLog.getDetails(),
				auditLog.getOccurredAt()
		);
	}

}
