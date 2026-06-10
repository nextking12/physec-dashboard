package com.nextking12.physical_security_dashboard.service;

import com.nextking12.physical_security_dashboard.auth.JwtService;
import com.nextking12.physical_security_dashboard.dto.LoginRequest;
import com.nextking12.physical_security_dashboard.dto.LoginResponse;
import com.nextking12.physical_security_dashboard.exception.InvalidCredentialsException;
import com.nextking12.physical_security_dashboard.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;

	public AuthService(
			UserRepository userRepository,
			PasswordEncoder passwordEncoder,
			JwtService jwtService
	) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
	}

	public LoginResponse login(LoginRequest request) {
		var user = userRepository.findByUsername(request.username())
				.filter(found -> passwordEncoder.matches(request.password(), found.getPasswordHash()))
				.orElseThrow(() -> new InvalidCredentialsException("Invalid username or password"));

		String accessToken = jwtService.generateToken(user);

		return new LoginResponse(
				accessToken,
				jwtService.getExpirationMs(),
				user.getUsername(),
				user.getRole()
		);
	}

}
