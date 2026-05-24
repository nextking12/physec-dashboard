package com.nextking12.physical_security_dashboard.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "devices")
public class Device {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String name;

    @Enumerated(EnumType.STRING)
    private DeviceType type;

	private String location;

    @Enumerated(EnumType.STRING)
    private DeviceStatus status;

	private Instant createdAt = Instant.now();
}
