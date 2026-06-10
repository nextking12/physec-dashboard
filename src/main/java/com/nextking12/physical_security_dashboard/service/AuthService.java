package com.nextking12.physical_security_dashboard.service;

import com.nextking12.physical_security_dashboard.auth.JwtService;
import com.nextking12.physical_security_dashboard.dto.LoginRequest;
import com.nextking12.physical_security_dashboard.dto.LoginResponse;
import com.nextking12.physical_security_dashboard.dto.MeResponse;
import com.nextking12.physical_security_dashboard.entity.UserRole;
import com.nextking12.physical_security_dashboard.exception.InvalidCredentialsException;
import com.nextking12.physical_security_dashboard.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
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

	public MeResponse getCurrentUser() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

		if (authentication == null || !authentication.isAuthenticated()) {
			throw new InvalidCredentialsException("Not authenticated");
		}

		String username = authentication.getName();
		UserRole role = authentication.getAuthorities().stream()
				.map(GrantedAuthority::getAuthority)
				.filter(authority -> authority.startsWith("ROLE_"))
				.map(authority -> UserRole.valueOf(authority.substring("ROLE_".length())))
				.findFirst()
				.orElseThrow(() -> new InvalidCredentialsException("Not authenticated"));

		return new MeResponse(username, role);
	}

}
