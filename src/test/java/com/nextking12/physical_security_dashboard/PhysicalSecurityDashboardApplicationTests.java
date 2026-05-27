package com.nextking12.physical_security_dashboard;

import com.nextking12.physical_security_dashboard.repository.DeviceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
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

    private static final String TEST_USERNAME = "test-user";
    private static final String TEST_PASSWORD = "test-password";

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    DeviceRepository deviceRepository;

    @DynamicPropertySource
    static void configurePostgres(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        registry.add("spring.security.user.name", () -> TEST_USERNAME);
        registry.add("spring.security.user.password", () -> TEST_PASSWORD);
    }

    @BeforeEach
    void setUp() {
        deviceRepository.deleteAll();
    }

    @Test
    void filtersDevicesByStatusTypeAndLocation() throws Exception {
        createDevice("Front Entrance Camera", "CAMERA", "Main Lobby", "ONLINE");
        createDevice("Rear Door Reader", "CARD_READER", "Rear Entrance", "OFFLINE");
        createDevice("Lobby Motion Sensor", "MOTION_SENSOR", "Main Lobby", "ONLINE");
        createDevice("East Wing Alarm Panel", "ALARM_PANEL", "East Wing", "MAINTENANCE");

        mockMvc.perform(get("/api/devices")
                        .param("status", "ONLINE")
                        .with(httpBasic(TEST_USERNAME, TEST_PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", containsInAnyOrder(
                        "Front Entrance Camera",
                        "Lobby Motion Sensor"
                )));

        mockMvc.perform(get("/api/devices")
                        .param("type", "CARD_READER")
                        .with(httpBasic(TEST_USERNAME, TEST_PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Rear Door Reader"));

        mockMvc.perform(get("/api/devices")
                        .param("location", "lobby")
                        .with(httpBasic(TEST_USERNAME, TEST_PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", containsInAnyOrder(
                        "Front Entrance Camera",
                        "Lobby Motion Sensor"
                )));
    }

    @Test
    void rejectsInvalidEnumFilter() throws Exception {
        mockMvc.perform(get("/api/devices")
                        .param("status", "banana")
                        .with(httpBasic(TEST_USERNAME, TEST_PASSWORD)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void requiresAuthenticationForDeviceApi() throws Exception {
        mockMvc.perform(get("/api/devices"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void allowsHealthCheckWithoutAuthentication() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk());
    }

    private void createDevice(String name, String type, String location, String status) throws Exception {
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
                        .with(httpBasic(TEST_USERNAME, TEST_PASSWORD)))
                .andExpect(status().isCreated());
    }
}
