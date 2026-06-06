package com.nextking12.physical_security_dashboard.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;

@Configuration
public class SecurityConfig {

	private static final Logger logger = LoggerFactory.getLogger(SecurityConfig.class);

	@Value("${spring.security.user.name}")
	private String username;

	@Value("${spring.security.user.password}")
	private String password;

	@Bean
	UserDetailsService userDetailsService() {
		return new InMemoryUserDetailsManager(
				User.withUsername(username)
						.password("{noop}" + password)
						.roles("USER")
						.build()
		);
	}

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		return http
				.cors(cors -> {})
				.csrf(csrf -> csrf.disable())
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(auth -> auth
						.requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
						.requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
						.anyRequest().authenticated())
				.httpBasic(basic -> basic
						.authenticationEntryPoint((request, response, authException) -> {
							logFailedBasicAuthAttempt(request.getHeader("Authorization"));
							response.setStatus(HttpStatus.UNAUTHORIZED.value());
						}))
				.build();
	}

	@Bean
	CorsConfigurationSource corsConfigurationSource(
			@Value("${app.cors.allowed-origins:http://localhost:5173,http://127.0.0.1:5173}")
			String allowedOrigins
	) {
		CorsConfiguration configuration = new CorsConfiguration();
		configuration.setAllowedOrigins(Arrays.stream(allowedOrigins.split(","))
				.map(String::trim)
				.filter(origin -> !origin.isBlank())
				.toList());
		configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
		configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/api/**", configuration);
		return source;
	}

	@EventListener(ApplicationReadyEvent.class)
	void logConfiguredSecurityUser() {
		logger.info("Configured Basic Auth user '{}' with password length {}", username, password.length());
	}

	private void logFailedBasicAuthAttempt(String authorizationHeader) {
		if (authorizationHeader == null || !authorizationHeader.startsWith("Basic ")) {
			logger.info("Rejected Basic Auth request without Basic Authorization header");
			return;
		}

		try {
			String encodedCredentials = authorizationHeader.substring("Basic ".length());
			String credentials = new String(Base64.getDecoder().decode(encodedCredentials), StandardCharsets.UTF_8);
			int separator = credentials.indexOf(':');
			if (separator < 0) {
				logger.info("Rejected Basic Auth request with malformed credentials");
				return;
			}

			String attemptedUsername = credentials.substring(0, separator);
			String attemptedPassword = credentials.substring(separator + 1);
			logger.info("Rejected Basic Auth user '{}' with password length {}", attemptedUsername, attemptedPassword.length());
		} catch (IllegalArgumentException exception) {
			logger.info("Rejected Basic Auth request with invalid Base64 credentials");
		}
	}
}
