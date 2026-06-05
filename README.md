# Physical Security Dashboard

A full-stack physical security operations dashboard. The current version manages security devices such as cameras, card readers, alarm panels, and motion sensors.

This project is built as a portfolio-ready app with a Spring Boot API, PostgreSQL persistence, Docker-based local setup, Basic Auth, Swagger documentation, integration tests, and a React dashboard frontend.

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
- React
- Vite

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
- Use a React dashboard for login, device metrics, filtering, and device management

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
APP_CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
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

## Frontend

Install frontend dependencies:

```bash
cd frontend
npm install
```

Create the optional frontend environment file:

```bash
cp .env.example .env
```

For local development, leave `VITE_API_BASE_URL` blank so Vite can proxy API requests to the backend:

```env
VITE_API_BASE_URL=
```

Start the frontend dev server:

```bash
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

The Vite dev server proxies `/api` and `/actuator` requests to the Spring Boot backend at `http://localhost:8080`.

Use the same `APP_USERNAME` and `APP_PASSWORD` values from your `.env` file to sign in.

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

## Deployment

The backend targets Railway and the frontend targets Vercel. Both use the same GitHub repository but are configured as two separate services.

### Backend on Railway

1. Create a new Railway project from this repository. Railway auto-detects the `Dockerfile` at the repo root and uses the `railway.json` healthcheck (`/actuator/health`).
2. Add a Postgres plugin to the project. Railway exposes `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, and `PGPASSWORD`, which the app already understands via the fallback in `application.yaml`.
3. In the backend service's **Variables** tab, set:
   - `SPRING_PROFILES_ACTIVE=prod`
   - `APP_USERNAME=<your-username>`
   - `APP_PASSWORD=<your-password>`
   - `APP_CORS_ALLOWED_ORIGINS=https://<your-vercel-domain>.vercel.app`
4. Deploy. The first boot runs Flyway migrations and creates the `devices` table automatically.
5. After the first deploy succeeds, note the public URL (for example `https://physical-security-dashboard.up.railway.app`) and use it in the frontend step.

### Frontend on Vercel

1. Import the same repository into Vercel.
2. Set the project root to `frontend/` (Vercel auto-detects Vite).
3. Add the environment variable:
   - `VITE_API_BASE_URL=https://<your-railway-domain>.up.railway.app`
4. Deploy. The `vercel.json` rewrite sends all routes to `index.html` so the SPA handles navigation.

### Local cleanup before deploying

- Rotate any password you used in your local `.env`. Do not reuse it in production.
- The default `admin` / `dev-password` credentials in `application.yaml` are only fallbacks; production must set `APP_USERNAME` and `APP_PASSWORD` or the deployed app will start with weak defaults.

### Production notes

- HTTPS is required because Basic Auth sends credentials with every request. Both Railway and Vercel provide TLS by default.
- Swagger and OpenAPI are disabled outside the `dev` profile.
- Database schema is managed by Flyway (`src/main/resources/db/migration`). Never set `spring.jpa.hibernate.ddl-auto` to `update` or `create` in production; the `prod` profile pins it to `validate`.
- The `dev` profile no longer relies on `ddl-auto: update` either; the Flyway migration is the single source of truth for the schema in every environment.

## Roadmap

- Polish the frontend dashboard
- Add dashboard summary metrics
- Add security event tracking
- Add alert severity filtering
- Add audit logs
- Replace Basic Auth with JWT or another production-grade auth flow if the app grows
