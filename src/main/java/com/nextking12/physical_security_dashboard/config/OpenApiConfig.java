package com.nextking12.physical_security_dashboard.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

	private static final String BASIC_AUTH = "basicAuth";

	@Bean
	OpenAPI openAPI() {
		return new OpenAPI()
				.addSecurityItem(new SecurityRequirement().addList(BASIC_AUTH))
				.components(new Components()
						.addSecuritySchemes(BASIC_AUTH, new SecurityScheme()
								.type(SecurityScheme.Type.HTTP)
								.scheme("basic")));
	}
}
