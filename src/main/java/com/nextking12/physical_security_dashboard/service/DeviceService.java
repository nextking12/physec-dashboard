package com.nextking12.physical_security_dashboard.service;

import com.nextking12.physical_security_dashboard.dto.CreateDeviceRequest;
import com.nextking12.physical_security_dashboard.dto.DeviceResponse;
import com.nextking12.physical_security_dashboard.dto.UpdateDeviceRequest;
import com.nextking12.physical_security_dashboard.entity.Device;
import com.nextking12.physical_security_dashboard.exception.ResourceNotFoundException;
import com.nextking12.physical_security_dashboard.repository.DeviceRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DeviceService {

	private final DeviceRepository deviceRepository;

	public DeviceService(DeviceRepository deviceRepository) {
		this.deviceRepository = deviceRepository;
	}

	public List<DeviceResponse> findAll() {
		return deviceRepository.findAll()
				.stream()
				.map(DeviceResponse::from)
				.toList();
	}

	public DeviceResponse create(CreateDeviceRequest request) {
		Device device = new Device();
		device.setName(request.name());
		device.setType(request.type());
		device.setLocation(request.location());
		device.setStatus(request.status());

		return DeviceResponse.from(deviceRepository.save(device));
	}

    public DeviceResponse findById(Long id) {
        return deviceRepository.findById(id)
                .map(DeviceResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Device not found with id: " + id));
    }
    public DeviceResponse update(Long id, UpdateDeviceRequest request) {
        Device device = deviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Device not found with id: " + id));
        device.setName(request.name());
        device.setType(request.type());
        device.setLocation(request.location());
        device.setStatus(request.status());
        return DeviceResponse.from(deviceRepository.save(device));
    }
    public void delete(Long id) {
        if (!deviceRepository.existsById(id)) {
            throw new ResourceNotFoundException(
                    "Device not found with id: " + id);
        }
        deviceRepository.deleteById(id);
    }
}
