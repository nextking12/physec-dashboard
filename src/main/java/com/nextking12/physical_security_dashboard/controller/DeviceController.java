package com.nextking12.physical_security_dashboard.controller;

import com.nextking12.physical_security_dashboard.dto.CreateDeviceRequest;
import com.nextking12.physical_security_dashboard.dto.DeviceResponse;
import com.nextking12.physical_security_dashboard.service.DeviceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/devices")
public class DeviceController {

	private final DeviceService deviceService;

	public DeviceController(DeviceService deviceService) {
		this.deviceService = deviceService;
	}

	@GetMapping
	public List<DeviceResponse> getAllDevices() {
		return deviceService.findAll();
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public DeviceResponse createDevice(@Valid @RequestBody CreateDeviceRequest request) {
		return deviceService.create(request);
	}
}
