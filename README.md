# Physical Security Dashboard API

A Spring Boot backend for a physical security operations dashboard. The current version manages security devices such as cameras, card readers, alarm panels, and motion sensors.

This project is built as a portfolio-ready backend API with PostgreSQL persistence, Docker-based local setup, Swagger documentation, basic API security, validation, filtering, and integration tests.

## Tech Stack

- Java 25
- Spring Boot 4
- Spring Web MVC
- Spring Data JPA
- Spring Security
- PostgreSQL
- Docker Compose
- Swagger / OpenAPI
- Testcontainers
- Maven

## Features

- Create, read, update, and delete physical security devices
- Filter devices by status, type, and location
- Store optional asset details such as model, MAC address, IP address, and manufacturer
- Validate required request fields
- Use enums for controlled device types and statuses
- Protect API endpoints with HTTP Basic authentication
- Expose Swagger only in the local dev profile
- Expose only the Actuator health endpoint
- Run integration tests against PostgreSQL with Testcontainers

## Requirements

- Java 25
- Docker Desktop
- Maven wrapper included in the project

## Local Setup

Create your local environment file:

```bash
cp .env.example .env
```

Your `.env` should include:

```env
POSTGRES_DB=physical_security_dashboard
POSTGRES_HOST=localhost
POSTGRES_USER=myuser
POSTGRES_PASSWORD=secret
POSTGRES_PORT=5432

APP_USERNAME=admin
APP_PASSWORD=dev-password
```

Start PostgreSQL:

```bash
docker compose up -d
```

Start the application with the dev profile and your local `.env` values:

```bash
set -a; source .env; set +a; ./mvnw spring-boot:run -Pdev
```

If you run only `./mvnw spring-boot:run -Pdev`, the app will use the fallback dev credentials from `application-dev.yaml`.

The API runs at:

```text
http://localhost:8080
```

## Swagger

Swagger is enabled only when running with the `dev` profile:

```text
http://localhost:8080/swagger-ui.html
```

Click `Authorize` in Swagger and use the values from your `.env`:

```text
username: admin
password: dev-password
```

## API Overview

All `/api/**` endpoints require HTTP Basic authentication.

### List Devices

```http
GET /api/devices
```

Optional query parameters:

```text
status=ONLINE
type=CAMERA
location=lobby
```

Example:

```http
GET /api/devices?status=ONLINE&type=CAMERA&location=lobby
```

### Get Device By ID

```http
GET /api/devices/{id}
```

### Create Device

```http
POST /api/devices
Content-Type: application/json
```

```json
{
  "name": "Front Entrance Camera",
  "type": "CAMERA",
  "location": "Main Lobby",
  "status": "ONLINE",
  "model": "Axis P3265-LV",
  "macAddress": "00:1A:2B:3C:4D:5E",
  "ipAddress": "192.168.1.10",
  "manufacturer": "Axis"
}
```

### Update Device

```http
PUT /api/devices/{id}
Content-Type: application/json
```

Uses the same request body shape as create.

### Delete Device

```http
DELETE /api/devices/{id}
```

Returns `204 No Content` when successful.

## Device Values

Supported device types:

```text
CAMERA
CARD_READER
ALARM_PANEL
MOTION_SENSOR
```

Supported device statuses:

```text
ONLINE
OFFLINE
MAINTENANCE
ALERTING
```

## Tests

Run the test suite:

```bash
./mvnw test
```

The integration tests use Testcontainers, so Docker must be running.

## Deployment Notes

- Do not run production with the `dev` profile.
- Set `APP_USERNAME` and `APP_PASSWORD` in the deployment environment.
- Set database variables in the deployment environment. The app accepts either this project's `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` names, or Railway-style `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, and `PGPASSWORD` names.
- If your host provides a `PORT` variable, the app will use it automatically.
- Use HTTPS in production because Basic Auth sends credentials with each request.
- Swagger and OpenAPI docs are disabled by default outside the dev profile.
- Hibernate schema updates are dev-only; a future production version should use a migration tool such as Flyway or Liquibase.

## Roadmap

- Build a frontend dashboard
- Add dashboard summary metrics
- Add security event tracking
- Add alert severity filtering
- Add audit logs
- Replace Basic Auth with JWT or another production-grade auth flow if the app grows
