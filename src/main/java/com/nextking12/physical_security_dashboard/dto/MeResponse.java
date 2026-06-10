package com.nextking12.physical_security_dashboard.dto;

import com.nextking12.physical_security_dashboard.entity.UserRole;

public record MeResponse(
		String username,
		UserRole role
) {
}
