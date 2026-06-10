package com.nextking12.physical_security_dashboard.controller;

import com.nextking12.physical_security_dashboard.dto.LoginRequest;
import com.nextking12.physical_security_dashboard.dto.LoginResponse;
import com.nextking12.physical_security_dashboard.dto.MeResponse;
import com.nextking12.physical_security_dashboard.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@PostMapping("/login")
	public LoginResponse login(@Valid @RequestBody LoginRequest request) {
		return authService.login(request);
	}

	@GetMapping("/me")
	public MeResponse me() {
		return authService.getCurrentUser();
	}

}
