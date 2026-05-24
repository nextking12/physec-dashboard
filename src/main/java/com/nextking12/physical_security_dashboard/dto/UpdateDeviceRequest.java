package com.nextking12.physical_security_dashboard.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateDeviceRequest(
        @NotBlank String name,
        @NotBlank String type,
        @NotBlank String location,
        @NotBlank String status
) {
}
