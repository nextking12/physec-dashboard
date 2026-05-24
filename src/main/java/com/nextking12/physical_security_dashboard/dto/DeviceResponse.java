package com.nextking12.physical_security_dashboard.dto;

import com.nextking12.physical_security_dashboard.entity.Device;
import com.nextking12.physical_security_dashboard.entity.DeviceStatus;
import com.nextking12.physical_security_dashboard.entity.DeviceType;

import java.time.Instant;

public record DeviceResponse(
		Long id,
		String name,
		DeviceType type,
		String location,
		DeviceStatus status,
		Instant createdAt,
        String model,
        String macAddress,
        String ipAddress,
        String manufacturer
) {

	public static DeviceResponse from(Device device) {
		return new DeviceResponse(
				device.getId(),
				device.getName(),
				device.getType(),
				device.getLocation(),
				device.getStatus(),
				device.getCreatedAt(),
                device.getModel(),
                device.getMacAddress(),
                device.getIpAddress(),
                device.getManufacturer()
		);
	}
}
