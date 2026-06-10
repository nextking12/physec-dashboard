package com.nextking12.physical_security_dashboard.controller;

import com.nextking12.physical_security_dashboard.dto.AuditLogResponse;
import com.nextking12.physical_security_dashboard.entity.AuditAction;
import com.nextking12.physical_security_dashboard.service.AuditService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

	private final AuditService auditService;

	public AuditLogController(AuditService auditService) {
		this.auditService = auditService;
	}

	@GetMapping
	@PreAuthorize("hasRole('ADMIN')")
	public List<AuditLogResponse> getAuditLogs(
			@RequestParam(required = false) AuditAction action,
			@RequestParam(required = false) String entityType
	) {
		return auditService.findAll(action, entityType);
	}

}
