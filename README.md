# Physical Security Dashboard

A full-stack physical security operations dashboard. The current version manages security devices such as cameras, card readers, alarm panels, and motion sensors.

This project is built as a portfolio-ready app with a Spring Boot API, PostgreSQL persistence, Flyway migrations, JWT authentication, role-based access control, audit logging, integration tests, and a React dashboard frontend.

## Live Demo

The deployed app is linked in the repository About section.

Use **Try Read-Only Demo** on the sign-in screen to explore sample device data without credentials.

## Tech Stack

- Java 25
- Spring Boot 4
- Spring Web MVC
- Spring Data JPA
- Spring Security
- PostgreSQL
- Docker Compose
- Swagger / OpenAPI for local development
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
- Authenticate with JWT bearer tokens and role-based access control
- Record an immutable audit trail for device create, update, and delete actions
- Expose Swagger only in the local dev profile
- Manage database schema with Flyway migrations
- Expose only the Actuator health endpoint in production
- Run integration tests against PostgreSQL with Testcontainers
- Use a React dashboard for login, device metrics, filtering, role-gated device management, and admin audit review

## Requirements

- Java 25
- Docker Desktop
- Maven wrapper included in the project

## Local Setup

Create your local environment file:

```bash
cp .env.example .env
```

Your `.env` should include local-only values. These are examples, not production credentials:

```env
POSTGRES_DB=physical_security_dashboard
POSTGRES_HOST=localhost
POSTGRES_USER=local_user
POSTGRES_PASSWORD=change-me-local-postgres-password
POSTGRES_PORT=5432

APP_CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
JWT_SECRET=change-me-local-jwt-secret-at-least-32-chars
JWT_EXPIRATION_MS=3600000
```

Always load `.env` before starting the backend so Spring and Docker Compose use the same database credentials:

```bash
set -a; source .env; set +a; docker compose up -d
set -a; source .env; set +a; ./mvnw spring-boot:run -Pdev
```

If Postgres was previously started with different credentials, reset the local volume:

```bash
docker compose down -v
set -a; source .env; set +a; docker compose up -d
```

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

When the backend runs with the `dev` profile, Flyway also runs local-only seed data from `src/main/resources/db/dev-migration`. Sign in with one of the seeded dev users. All three use the password `changeme`:

```text
admin    (ADMIN)
operator (OPERATOR)
viewer   (VIEWER)
```

## Swagger

Swagger is enabled only when running with the `dev` profile:

```text
http://localhost:8080/swagger-ui.html
```

In Swagger, call `POST /api/auth/login`, copy the `accessToken`, then click `Authorize` and paste:

```text
Bearer <accessToken>
```

## Authentication

### Login

Local dev example using the seeded `admin` user:

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "username": "admin",
  "password": "changeme"
}
```

Example response:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "expiresIn": 3600000,
  "username": "admin",
  "role": "ADMIN"
}
```

### Current User

```http
GET /api/auth/me
Authorization: Bearer <accessToken>
```

All protected `/api/**` endpoints require a valid JWT in the `Authorization` header.

## Roles

| Action | VIEWER | OPERATOR | ADMIN |
| --- | --- | --- | --- |
| `GET /api/devices` | yes | yes | yes |
| `POST /api/devices` | no | yes | yes |
| `PUT /api/devices/{id}` | no | yes | yes |
| `DELETE /api/devices/{id}` | no | no | yes |
| `GET /api/audit-logs` | no | no | yes |

## API Overview

### List Devices

```http
GET /api/devices
Authorization: Bearer <accessToken>
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
Authorization: Bearer <accessToken>
```

### Create Device

```http
POST /api/devices
Authorization: Bearer <accessToken>
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
Authorization: Bearer <accessToken>
Content-Type: application/json
```

Uses the same request body shape as create.

### Delete Device

```http
DELETE /api/devices/{id}
Authorization: Bearer <accessToken>
```

Returns `204 No Content` when successful.

### List Audit Logs

```http
GET /api/audit-logs
Authorization: Bearer <accessToken>
```

Admin only. Optional query parameters:

```text
action=CREATE
entityType=DEVICE
```

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

The deployed app uses Railway for the Spring Boot API and PostgreSQL database, and Vercel for the React frontend. Both deployments can use the same GitHub repository.

### Backend on Railway

1. Create a Railway project from this repository.
2. Deploy the backend service from the repo root. `railway.json` tells Railway to use the root `Dockerfile` and healthcheck `/actuator/health`.
3. Add a Railway PostgreSQL database to the same project.
4. In the backend service's **Variables** tab, set:
   - `SPRING_PROFILES_ACTIVE=prod`
   - `JWT_SECRET=<random-32+-character-secret>`
   - `JWT_EXPIRATION_MS=3600000`
   - `APP_CORS_ALLOWED_ORIGINS=https://<your-vercel-domain>`
   - `PGHOST=${{ Postgres.PGHOST }}`
   - `PGPORT=${{ Postgres.PGPORT }}`
   - `PGDATABASE=${{ Postgres.PGDATABASE }}`
   - `PGUSER=${{ Postgres.PGUSER }}`
   - `PGPASSWORD=${{ Postgres.PGPASSWORD }}`
5. Deploy the backend and generate a public Railway domain.
6. Verify the backend:

```bash
curl https://<your-railway-domain>/actuator/health
```

The first boot runs Flyway migrations and creates the `devices`, `users`, and `audit_logs` tables automatically. Production does not seed login users. Create production users manually with private credentials before expecting login to work.

After creating a production user, verify login with that private username and password:

```bash
curl -s -X POST https://<your-railway-domain>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"<your-production-username>","password":"<your-production-password>"}'
```

### Frontend on Vercel

1. Import the same repository into Vercel.
2. Set the project root to `frontend/` (Vercel auto-detects Vite).
3. Add the environment variable:
   - `VITE_API_BASE_URL=https://<your-railway-domain>`
4. Deploy. The `vercel.json` rewrite sends all routes to `index.html` so the SPA handles navigation.
5. Copy the Vercel frontend URL.
6. In Railway, update the backend variable:
   - `APP_CORS_ALLOWED_ORIGINS=https://<your-vercel-domain>,https://<your-project>-*-<your-team>.vercel.app`
   - The second entry is optional and uses a wildcard to match Vercel preview deployments, which get a unique build-hash subdomain on every deploy.
7. Redeploy or restart the backend, then sign in through the Vercel frontend.

### Deployment Notes

- Keep `.env` local. It is gitignored and Railway/Vercel do not read it.
- Use a long, random `JWT_SECRET` in production. Do not reuse the local example value.
- Do not use Railway's `DATABASE_PUBLIC_URL` for the deployed backend. Use the private `PG*` variables.
- `APP_CORS_ALLOWED_ORIGINS` accepts comma-separated origin patterns (exact URLs or patterns containing `*` wildcards). Add your production Vercel URL, plus a wildcard pattern if you want preview deployments to work.
- HTTPS is required for production deployments. Railway and Vercel provide HTTPS by default.
- The frontend stores JWTs in `sessionStorage` for this portfolio SPA. That is acceptable for a demo, but httpOnly cookies are a stronger choice for high-risk production apps.
- Swagger and OpenAPI are disabled outside the `dev` profile.
- Database schema is managed by Flyway in `src/main/resources/db/migration`.
- Never set `spring.jpa.hibernate.ddl-auto` to `update` or `create` in production. The `prod` profile uses `validate` so Hibernate checks the Flyway-managed schema.

## Roadmap

- Polish the frontend dashboard
- Add backend dashboard summary metrics
- Add security event tracking
- Add alert severity filtering
- Add admin user management for production accounts
