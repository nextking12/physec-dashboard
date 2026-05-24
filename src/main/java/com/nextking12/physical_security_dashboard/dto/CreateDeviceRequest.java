package com.nextking12.physical_security_dashboard.dto;

import com.nextking12.physical_security_dashboard.entity.DeviceStatus;
import com.nextking12.physical_security_dashboard.entity.DeviceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateDeviceRequest(
        @NotBlank String name,
        @NotNull DeviceType type,//@NotNull for objects. Enums are objects which is referenced
        @NotBlank String location,
        @NotNull DeviceStatus status
) {
}
