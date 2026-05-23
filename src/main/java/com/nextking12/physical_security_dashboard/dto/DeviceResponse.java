package com.nextking12.physical_security_dashboard.dto;

import com.nextking12.physical_security_dashboard.entity.Device;

import java.time.Instant;

public record DeviceResponse(
		Long id,
		String name,
		String type,
		String location,
		String status,
		Instant createdAt
) {

	public static DeviceResponse from(Device device) {
		return new DeviceResponse(
				device.getId(),
				device.getName(),
				device.getType(),
				device.getLocation(),
				device.getStatus(),
				device.getCreatedAt()
		);
	}
}
