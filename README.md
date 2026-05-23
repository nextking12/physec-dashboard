# Physical Security Dashboard

A Spring Boot backend for a security operations dashboard. The first MVP slice tracks physical security devices such as cameras, readers, panels, and sensors.

## Current API

### List devices

```http
GET http://localhost:8080/api/devices
```

### Create device

```http
POST http://localhost:8080/api/devices
Content-Type: application/json

{
  "name": "Front Entrance Camera",
  "type": "CAMERA",
  "location": "Main Lobby",
  "status": "ONLINE"
}
```

## Run Locally

Start PostgreSQL:

```bash
docker compose up -d
```

Start the app:

```bash
./mvnw spring-boot:run
```

OpenAPI docs are available at:

```text
http://localhost:8080/swagger-ui.html
```

## Roadmap

- Device CRUD
- Security event feed
- Alert severity filtering
- Audit logs
- Spring Security with JWT
- Role-based access control
- WebSocket live updates
- React frontend
