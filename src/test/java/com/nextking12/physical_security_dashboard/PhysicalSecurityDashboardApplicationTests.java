package com.nextking12.physical_security_dashboard;

import com.nextking12.physical_security_dashboard.entity.User;
import com.nextking12.physical_security_dashboard.entity.UserRole;
import com.nextking12.physical_security_dashboard.repository.AuditLogRepository;
import com.nextking12.physical_security_dashboard.repository.DeviceRepository;
import com.nextking12.physical_security_dashboard.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class PhysicalSecurityDashboardApplicationTests {

	@Container
	static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

	private static final String ADMIN_USERNAME = "admin";
	private static final String OPERATOR_USERNAME = "operator";
	private static final String VIEWER_USERNAME = "viewer";
	private static final String SEED_PASSWORD = "changeme";

	@Autowired
	MockMvc mockMvc;

	@Autowired
	ObjectMapper objectMapper;

	@Autowired
	DeviceRepository deviceRepository;

	@Autowired
	AuditLogRepository auditLogRepository;

	@Autowired
	UserRepository userRepository;

	@Autowired
	PasswordEncoder passwordEncoder;

	@DynamicPropertySource
	static void configurePostgres(DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", postgres::getJdbcUrl);
		registry.add("spring.datasource.username", postgres::getUsername);
		registry.add("spring.datasource.password", postgres::getPassword);
		registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
	}

	@BeforeEach
	void setUp() {
		auditLogRepository.deleteAll();
		deviceRepository.deleteAll();
		userRepository.deleteAll();

		createUser(ADMIN_USERNAME, UserRole.ADMIN);
		createUser(OPERATOR_USERNAME, UserRole.OPERATOR);
		createUser(VIEWER_USERNAME, UserRole.VIEWER);
	}

	@Test
	void loginReturnsJwtForValidCredentials() throws Exception {
		mockMvc.perform(post("/api/auth/login")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(Map.of(
								"username", ADMIN_USERNAME,
								"password", SEED_PASSWORD
						))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.accessToken").isNotEmpty())
				.andExpect(jsonPath("$.username").value(ADMIN_USERNAME))
				.andExpect(jsonPath("$.role").value("ADMIN"));
	}

	@Test
	void meReturnsCurrentUserFromJwt() throws Exception {
		String token = obtainAccessToken(ADMIN_USERNAME, SEED_PASSWORD);

		mockMvc.perform(get("/api/auth/me")
						.header("Authorization", "Bearer " + token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.username").value(ADMIN_USERNAME))
				.andExpect(jsonPath("$.role").value("ADMIN"));
	}

	@Test
	void filtersDevicesByStatusTypeAndLocation() throws Exception {
		String token = obtainAccessToken(ADMIN_USERNAME, SEED_PASSWORD);

		createDevice(token, "Front Entrance Camera", "CAMERA", "Main Lobby", "ONLINE");
		createDevice(token, "Rear Door Reader", "CARD_READER", "Rear Entrance", "OFFLINE");
		createDevice(token, "Lobby Motion Sensor", "MOTION_SENSOR", "Main Lobby", "ONLINE");
		createDevice(token, "East Wing Alarm Panel", "ALARM_PANEL", "East Wing", "MAINTENANCE");

		mockMvc.perform(get("/api/devices")
						.param("status", "ONLINE")
						.header("Authorization", "Bearer " + token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[*].name", containsInAnyOrder(
						"Front Entrance Camera",
						"Lobby Motion Sensor"
				)));

		mockMvc.perform(get("/api/devices")
						.param("type", "CARD_READER")
						.header("Authorization", "Bearer " + token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].name").value("Rear Door Reader"));

		mockMvc.perform(get("/api/devices")
						.param("location", "lobby")
						.header("Authorization", "Bearer " + token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[*].name", containsInAnyOrder(
						"Front Entrance Camera",
						"Lobby Motion Sensor"
				)));
	}

	@Test
	void rejectsInvalidEnumFilter() throws Exception {
		String token = obtainAccessToken(ADMIN_USERNAME, SEED_PASSWORD);

		mockMvc.perform(get("/api/devices")
						.param("status", "banana")
						.header("Authorization", "Bearer " + token))
				.andExpect(status().isBadRequest());
	}

	@Test
	void requiresAuthenticationForDeviceApi() throws Exception {
		mockMvc.perform(get("/api/devices"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void viewerCanListDevices() throws Exception {
		String adminToken = obtainAccessToken(ADMIN_USERNAME, SEED_PASSWORD);
		createDevice(adminToken, "Lobby Camera", "CAMERA", "Lobby", "ONLINE");

		String viewerToken = obtainAccessToken(VIEWER_USERNAME, SEED_PASSWORD);

		mockMvc.perform(get("/api/devices")
						.header("Authorization", "Bearer " + viewerToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].name").value("Lobby Camera"));
	}

	@Test
	void viewerCannotCreateDevice() throws Exception {
		String viewerToken = obtainAccessToken(VIEWER_USERNAME, SEED_PASSWORD);

		mockMvc.perform(post("/api/devices")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(Map.of(
								"name", "Blocked Camera",
								"type", "CAMERA",
								"location", "Lobby",
								"status", "ONLINE"
						)))
						.header("Authorization", "Bearer " + viewerToken))
				.andExpect(status().isForbidden());
	}

	@Test
	void operatorCannotDeleteDevice() throws Exception {
		String adminToken = obtainAccessToken(ADMIN_USERNAME, SEED_PASSWORD);
		createDevice(adminToken, "Delete Me", "CAMERA", "Lobby", "ONLINE");

		long deviceId = deviceRepository.findAll().getFirst().getId();
		String operatorToken = obtainAccessToken(OPERATOR_USERNAME, SEED_PASSWORD);

		mockMvc.perform(delete("/api/devices/" + deviceId)
						.header("Authorization", "Bearer " + operatorToken))
				.andExpect(status().isForbidden());
	}

	@Test
	void creatingDeviceWritesAuditLog() throws Exception {
		String operatorToken = obtainAccessToken(OPERATOR_USERNAME, SEED_PASSWORD);

		createDevice(operatorToken, "Audited Camera", "CAMERA", "Lobby", "ONLINE");

		String adminToken = obtainAccessToken(ADMIN_USERNAME, SEED_PASSWORD);

		mockMvc.perform(get("/api/audit-logs")
						.header("Authorization", "Bearer " + adminToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].username").value(OPERATOR_USERNAME))
				.andExpect(jsonPath("$[0].action").value("CREATE"))
				.andExpect(jsonPath("$[0].entityType").value("DEVICE"))
				.andExpect(jsonPath("$[0].details").value("name=Audited Camera"));
	}

	@Test
	void operatorCannotViewAuditLogs() throws Exception {
		String operatorToken = obtainAccessToken(OPERATOR_USERNAME, SEED_PASSWORD);

		mockMvc.perform(get("/api/audit-logs")
						.header("Authorization", "Bearer " + operatorToken))
				.andExpect(status().isForbidden());
	}

	@Test
	void allowsHealthCheckWithoutAuthentication() throws Exception {
		mockMvc.perform(get("/actuator/health"))
				.andExpect(status().isOk());
	}

	private String obtainAccessToken(String username, String password) throws Exception {
		var response = mockMvc.perform(post("/api/auth/login")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(Map.of(
								"username", username,
								"password", password
						))))
				.andExpect(status().isOk())
				.andReturn()
				.getResponse()
				.getContentAsString();

		return objectMapper.readTree(response).get("accessToken").asText();
	}

	private void createUser(String username, UserRole role) {
		User user = new User();
		user.setUsername(username);
		user.setPasswordHash(passwordEncoder.encode(SEED_PASSWORD));
		user.setRole(role);
		userRepository.save(user);
	}

	private void createDevice(String token, String name, String type, String location, String status) throws Exception {
		Map<String, String> request = Map.of(
				"name", name,
				"type", type,
				"location", location,
				"status", status,
				"model", "Test Model",
				"macAddress", "00:1A:2B:3C:4D:5E",
				"ipAddress", "192.168.1.10",
				"manufacturer", "Test Manufacturer"
		);

		mockMvc.perform(post("/api/devices")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(request))
						.header("Authorization", "Bearer " + token))
				.andExpect(status().isCreated());
	}
}
