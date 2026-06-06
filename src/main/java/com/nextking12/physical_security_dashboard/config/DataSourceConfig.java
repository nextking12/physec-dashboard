package com.nextking12.physical_security_dashboard.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DataSourceConfig {

	@Bean
	@ConditionalOnProperty(name = "DATABASE_URL")
	DataSource databaseUrlDataSource(@Value("${DATABASE_URL}") String databaseUrl) {
		URI uri = URI.create(databaseUrl);
		String jdbcUrl = "jdbc:postgresql://" + uri.getHost() + ":" + uri.getPort() + uri.getPath();

		String username = "";
		String password = "";
		String userInfo = uri.getUserInfo();
		if (userInfo != null) {
			int colon = userInfo.indexOf(':');
			if (colon >= 0) {
				username = userInfo.substring(0, colon);
				password = userInfo.substring(colon + 1);
			} else {
				username = userInfo;
			}
		}

		HikariDataSource dataSource = new HikariDataSource();
		dataSource.setJdbcUrl(jdbcUrl);
		dataSource.setUsername(username);
		dataSource.setPassword(password);
		return dataSource;
	}
}
