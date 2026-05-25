package com.nextking12.physical_security_dashboard.controller;

import com.nextking12.physical_security_dashboard.dto.CreateDeviceRequest;
import com.nextking12.physical_security_dashboard.dto.DeviceResponse;
import com.nextking12.physical_security_dashboard.dto.UpdateDeviceRequest;
import com.nextking12.physical_security_dashboard.entity.DeviceStatus;
import com.nextking12.physical_security_dashboard.entity.DeviceType;
import com.nextking12.physical_security_dashboard.service.DeviceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/devices")
public class DeviceController {

	private final DeviceService deviceService;

	public DeviceController(DeviceService deviceService) {
		this.deviceService = deviceService;
	}

    @GetMapping
    public List<DeviceResponse> getAllDevices(
            @RequestParam(required = false) DeviceStatus status,
            @RequestParam(required = false) DeviceType type,
            @RequestParam(required = false) String location
    ) {
        return deviceService.findAll(status, type, location);
    }

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public DeviceResponse createDevice(@Valid @RequestBody CreateDeviceRequest request) {
		return deviceService.create(request);
	}

    @GetMapping("/{id}")
    public DeviceResponse getDevice(@PathVariable Long id) {
        return deviceService.findById(id);
    }
    @PutMapping("/{id}")
    public DeviceResponse updateDevice(@PathVariable Long id,
                                       @Valid @RequestBody UpdateDeviceRequest request) {
        return deviceService.update(id, request);
    }
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDevice(@PathVariable Long id) {
        deviceService.delete(id);
    }
}
