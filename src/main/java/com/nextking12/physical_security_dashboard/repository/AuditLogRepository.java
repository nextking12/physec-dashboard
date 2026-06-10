package com.nextking12.physical_security_dashboard.repository;

import com.nextking12.physical_security_dashboard.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
}
