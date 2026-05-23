package com.nextking12.physical_security_dashboard.repository;

import com.nextking12.physical_security_dashboard.entity.Device;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeviceRepository extends JpaRepository<Device, Long> {
}
