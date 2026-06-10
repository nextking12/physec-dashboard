package com.nextking12.physical_security_dashboard.service;

import com.nextking12.physical_security_dashboard.dto.CreateDeviceRequest;
import com.nextking12.physical_security_dashboard.dto.DeviceResponse;
import com.nextking12.physical_security_dashboard.dto.UpdateDeviceRequest;
import com.nextking12.physical_security_dashboard.entity.AuditAction;
import com.nextking12.physical_security_dashboard.entity.Device;
import com.nextking12.physical_security_dashboard.entity.DeviceStatus;
import com.nextking12.physical_security_dashboard.entity.DeviceType;
import com.nextking12.physical_security_dashboard.exception.ResourceNotFoundException;
import com.nextking12.physical_security_dashboard.repository.DeviceRepository;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import jakarta.persistence.criteria.Predicate;
@Service
public class DeviceService {

	private final DeviceRepository deviceRepository;
	private final AuditService auditService;

	public DeviceService(DeviceRepository deviceRepository, AuditService auditService) {
		this.deviceRepository = deviceRepository;
		this.auditService = auditService;
	}

    public List<DeviceResponse> findAll(DeviceStatus status, DeviceType type, String location) {
        Specification<Device> spec = (root, query, criteriaBuilder) -> {
            List<   Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }

            if (type != null) {
                predicates.add(criteriaBuilder.equal(root.get("type"), type));
            }

            if (location != null && !location.isBlank()) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("location")),
                        "%" + location.toLowerCase() + "%"
                ));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        return deviceRepository.findAll(spec)
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
        device.setManufacturer(request.manufacturer());
        device.setMacAddress(request.macAddress());
        device.setIpAddress(request.ipAddress());
        device.setModel(request.model());

		Device saved = deviceRepository.save(device);
		auditService.logDeviceAction(AuditAction.CREATE, saved);
		return DeviceResponse.from(saved);
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
        device.setManufacturer(request.manufacturer());
        device.setMacAddress(request.macAddress());
        device.setIpAddress(request.ipAddress());
        device.setModel(request.model());

        Device saved = deviceRepository.save(device);
        auditService.logDeviceAction(AuditAction.UPDATE, saved);
        return DeviceResponse.from(saved);
    }

    public void delete(Long id) {
        Device device = deviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Device not found with id: " + id));

        auditService.logDeviceDelete(device.getId(), device.getName());
        deviceRepository.deleteById(id);
    }
}
