# Appointment Management API

Spring Boot backend for a single-business appointment management system.

## Initial Stack

- Java 17
- Spring Boot 3
- Spring Web
- Spring Data JPA
- Spring Security
- Bean Validation
- PostgreSQL
- Flyway
- SpringDoc OpenAPI
- JUnit, Mockito, and Spring Security Test

## Package Structure

```text
src/main/java/com/turnos/api
|-- auth
|-- users
|-- services
|-- professionals
|-- appointments
|-- availability
|-- common
|-- config
```

## Profiles

- `dev`: uses a local PostgreSQL database.
- `test`: uses an in-memory H2 database in PostgreSQL compatibility mode.

Environment variables for `dev`:

```powershell
$env:DB_URL="jdbc:postgresql://localhost:5432/appointment_management"
$env:DB_USERNAME="postgres"
$env:DB_PASSWORD="postgres"
$env:JWT_SECRET="change-me-change-me-change-me-change-me"
$env:ADMIN_EMAIL="admin@turnos.local"
$env:ADMIN_PASSWORD="admin1234"
$env:DEMO_DATA_ENABLED="false"
$env:CORS_ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000"
```

If these variables are not set, the same values are used as defaults.

By default, CORS allows local React development servers on ports `5173` and `3000`.

To seed demo data in the `dev` profile, set:

```powershell
$env:DEMO_DATA_ENABLED="true"
```

Demo credentials:

```text
admin: admin@turnos.local / admin1234
client: demo.client@turnos.local / client1234
```

Demo data includes one client, one professional, one 30-minute service, and weekday business hours from 09:00 to 17:00.

## Local Database

Create a PostgreSQL database named `appointment_management` before starting the app with the `dev` profile.

```sql
CREATE DATABASE appointment_management;
```

## Running The App

With the Maven Wrapper:

```powershell
.\mvnw.cmd spring-boot:run
```

Or with an explicit profile:

```powershell
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev
```

If Maven is installed globally, `mvn` can be used instead of `.\mvnw.cmd`.

## Running Tests

```powershell
.\mvnw.cmd test
```

## Postman Collection

An automated Postman collection is available at:

```text
postman/appointment-management-api.postman_collection.json
```

To run it:

1. Start the application with the `dev` profile.
2. Import the collection into Postman.
3. Keep `baseUrl` as `http://localhost:8080`, or change it if the app is running on another port.
4. Run the collection from top to bottom.

The collection creates isolated test data with generated emails, logs in as admin and clients, creates catalog data, checks availability, creates appointments, validates history filters, validates client permissions, and checks a rejected invalid transition.

Optional Newman command:

```powershell
newman run postman/appointment-management-api.postman_collection.json
```

## Request Examples

Login:

```http
POST /auth/login
Content-Type: application/json
```

```json
{
  "email": "admin@turnos.local",
  "password": "admin1234"
}
```

Create a service:

```http
POST /api/services
Authorization: Bearer <admin-token>
Content-Type: application/json
```

```json
{
  "name": "General Consultation",
  "categoryId": 3,
  "description": "Initial appointment",
  "durationMinutes": 30,
  "price": 15000.00
}
```

Create a service category:

```http
POST /api/service-categories
Authorization: Bearer <admin-token>
Content-Type: application/json
```

```json
{
  "name": "Estetica facial",
  "slug": "estetica-facial",
  "description": "Procedimientos para el cuidado facial.",
  "displayOrder": 20
}
```

Create a professional:

```http
POST /api/professionals
Authorization: Bearer <admin-token>
Content-Type: application/json
```

```json
{
  "fullName": "Demo Professional",
  "email": "professional@example.com",
  "phone": "555-0202"
}
```

Limit a professional to selected services:

```http
PUT /api/professionals/1/services
Authorization: Bearer <admin-token>
Content-Type: application/json
```

```json
{
  "mode": "SELECTED_SERVICES",
  "serviceIds": [1, 2]
}
```

Restore a professional to all services:

```http
PUT /api/professionals/1/services
Authorization: Bearer <admin-token>
Content-Type: application/json
```

```json
{
  "mode": "ALL_SERVICES",
  "serviceIds": []
}
```

Limit a service to selected professionals:

```http
PUT /api/services/1/professionals
Authorization: Bearer <admin-token>
Content-Type: application/json
```

```json
{
  "mode": "SELECTED_PROFESSIONALS",
  "professionalIds": [1, 3]
}
```

Filter compatible catalog options:

```http
GET /api/professionals?serviceId=1
GET /api/services?professionalId=1
GET /api/services?categoryId=3
Authorization: Bearer <admin-token>
```

Create business hours:

```http
POST /api/business-hours
Authorization: Bearer <admin-token>
Content-Type: application/json
```

```json
{
  "professionalId": 1,
  "dayOfWeek": "MONDAY",
  "startTime": "09:00:00",
  "endTime": "17:00:00"
}
```

Check availability:

```http
GET /api/availability?professionalId=1&serviceId=1&date=2027-05-24
Authorization: Bearer <token>
```

Create an appointment as a client:

```http
POST /api/appointments
Authorization: Bearer <client-token>
Content-Type: application/json
```

```json
{
  "professionalId": 1,
  "serviceId": 1,
  "startDateTime": "2027-05-24T09:00:00"
}
```

Create an appointment as an admin:

```http
POST /api/appointments
Authorization: Bearer <admin-token>
Content-Type: application/json
```

```json
{
  "clientId": 2,
  "professionalId": 1,
  "serviceId": 1,
  "startDateTime": "2027-05-24T10:00:00"
}
```

Filter appointment history:

```http
GET /api/appointments?professionalId=1&status=CONFIRMED&page=0&size=20&sort=startDateTime,desc
Authorization: Bearer <admin-token>
```

Error response shape:

```json
{
  "timestamp": "2026-05-24T18:30:00Z",
  "status": 409,
  "error": "Conflict",
  "message": "Appointment transition is not allowed",
  "path": "/api/appointments/1/confirm"
}
```

## OpenAPI

With the app running:

- Swagger UI: <http://localhost:8080/swagger-ui.html>
- OpenAPI JSON: <http://localhost:8080/v3/api-docs>

## Authentication

Available endpoints:

```http
POST /auth/register
POST /auth/login
GET /api/users/me
```

`/auth/register` creates users with the `CLIENT` role.

Registration example:

```json
{
  "fullName": "Demo Client",
  "email": "client@email.com",
  "password": "password123",
  "phone": "123"
}
```

`/auth/login` returns a JWT. To call private routes, send:

```http
Authorization: Bearer <token>
```

When the application starts, it creates an administrator user if it does not already exist:

```text
email: admin@turnos.local
password: admin1234
```

These values can be changed with `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

## Current Status

The technical foundation is ready and Phase 1 added the initial domain and persistence model:

- JPA entities: `User`, `Service`, `Professional`, `Appointment`, `BusinessHours`, `AvailabilityBlock`.
- Domain enums: `UserRole`, `AppointmentStatus`, `CreatedByRole`, `AvailabilityBlockType`.
- Spring Data JPA repositories for each aggregate.
- Flyway migrations to create tables, relationships, indexes, and constraints.
- Unit tests for the main domain rules.

Phase 2 added base authentication:

- Public client registration.
- JWT login.
- Password hashing with BCrypt.
- Initial administrator user seeding.
- Public `/auth/**`.
- Protected `/api/**` with Bearer tokens.
- `GET /api/users/me`.

Phase 3 added administrative catalogs:

- Service CRUD at `/api/services`.
- Professional CRUD at `/api/professionals`.
- Business hours CRUD at `/api/business-hours`.
- Availability block CRUD at `/api/availability-blocks`.
- Logical deactivation through `/activate` and `/deactivate` endpoints.
- Validation for overlapping business hours for the same professional and day.
- Validation for availability blocks overlapping `PENDING` or `CONFIRMED` appointments.
- All catalog endpoints require the `ADMIN` role.

Main administrative endpoints:

```http
POST /api/services
GET /api/services
GET /api/services/{id}
PUT /api/services/{id}
PATCH /api/services/{id}/activate
PATCH /api/services/{id}/deactivate

POST /api/professionals
GET /api/professionals
GET /api/professionals/{id}
PUT /api/professionals/{id}
PATCH /api/professionals/{id}/activate
PATCH /api/professionals/{id}/deactivate

POST /api/business-hours
GET /api/business-hours
GET /api/business-hours/{id}
PUT /api/business-hours/{id}
PATCH /api/business-hours/{id}/activate
PATCH /api/business-hours/{id}/deactivate

POST /api/availability-blocks
GET /api/availability-blocks
GET /api/availability-blocks/{id}
PUT /api/availability-blocks/{id}
PATCH /api/availability-blocks/{id}/activate
PATCH /api/availability-blocks/{id}/deactivate
```

Phase 4 added appointment management:

- Clients create appointments in `PENDING` status.
- Admins create appointments in `CONFIRMED` status.
- `endDateTime` is calculated automatically from `Service.durationMinutes`.
- Active client, professional, and service validation.
- Active business hours validation.
- Overlap validation against `PENDING` or `CONFIRMED` appointments.
- Overlap validation against active availability blocks.
- Status transitions with timestamps and reasons.
- Appointments are never physically deleted.

Appointment endpoints:

```http
POST /api/appointments
GET /api/appointments
GET /api/appointments/{id}
PATCH /api/appointments/{id}/confirm
PATCH /api/appointments/{id}/reject
PATCH /api/appointments/{id}/cancel-by-client
PATCH /api/appointments/{id}/cancel-by-admin
PATCH /api/appointments/{id}/complete
PATCH /api/appointments/{id}/no-show
```

Main permission rules:

- `CLIENT` can create their own appointments and they are created as `PENDING`.
- `ADMIN` can create appointments for clients and they are created as `CONFIRMED`.
- `ADMIN` can confirm, reject, cancel as admin, complete, and mark no-show.
- `CLIENT` can cancel their own appointments through `/cancel-by-client`.
- `CLIENT` can only list and read their own appointments; `ADMIN` can list and read all appointments.

Phase 5 added dynamic availability:

- Calculates available slots without persisting them.
- Uses `Service.durationMinutes` as the initial slot duration and granularity.
- Considers active business hours.
- Excludes `PENDING` and `CONFIRMED` appointments.
- Excludes active availability blocks.
- Excludes past slots.
- Requires active professionals and services.

Endpoint:

```http
GET /api/availability?professionalId=1&serviceId=2&date=2027-05-24
```

Response example:

```json
[
  {
    "startDateTime": "2027-05-24T09:00:00",
    "endDateTime": "2027-05-24T09:30:00"
  }
]
```

Phase 6 added appointment history and operational queries:

- `GET /api/appointments` supports combined filters.
- `ADMIN` can query all appointments.
- `CLIENT` can only query their own appointments, even if a different `clientId` is sent.
- Results are paginated and sortable.
- The response uses a stable pagination DTO.

Supported query parameters:

```http
GET /api/appointments?clientId=1
GET /api/appointments?professionalId=2
GET /api/appointments?status=NO_SHOW
GET /api/appointments?from=2026-05-01T00:00:00&to=2026-05-31T23:59:59
GET /api/appointments?page=0&size=20&sort=startDateTime,desc
```

Paginated response shape:

```json
{
  "content": [],
  "page": 0,
  "size": 20,
  "totalElements": 0,
  "totalPages": 0,
  "first": true,
  "last": true
}
```

Update 1.1 added professional-service assignments:

- Professionals use `serviceAssignmentMode` with `ALL_SERVICES` as the default.
- `ALL_SERVICES` means no manual service rows are required.
- `SELECTED_SERVICES` limits a professional to rows stored in `professional_services`.
- Admins can assign services from the professional side or professionals from the service side.
- Appointment creation rejects incompatible `professionalId` + `serviceId` combinations with `409 Conflict`.
- Availability returns an empty list for incompatible combinations, while missing IDs and inactive catalog records still return their normal errors.
- `GET /api/professionals?serviceId=...` and `GET /api/services?professionalId=...` expose compatible options for admin screens and the future client booking flow.

Professional-service assignment endpoints:

```http
GET /api/professionals/{id}/services
PUT /api/professionals/{id}/services
GET /api/services/{id}/professionals
PUT /api/services/{id}/professionals
GET /api/professionals?serviceId={serviceId}
GET /api/services?professionalId={professionalId}
```

Professional assignment request:

```json
{
  "mode": "SELECTED_SERVICES",
  "serviceIds": [1, 2]
}
```

Professional assignment response:

```json
{
  "professionalId": 1,
  "mode": "SELECTED_SERVICES",
  "services": [
    {
      "id": 1,
      "name": "General Consultation",
      "active": true
    }
  ]
}
```

Service assignment request:

```json
{
  "mode": "SELECTED_PROFESSIONALS",
  "professionalIds": [1, 3]
}
```

Service assignment response:

```json
{
  "serviceId": 1,
  "mode": "SELECTED_PROFESSIONALS",
  "professionals": [
    {
      "id": 1,
      "fullName": "Demo Professional",
      "active": true,
      "serviceAssignmentMode": "SELECTED_SERVICES"
    }
  ]
}
```

Phase 8 prepared notification extension points:

- `NotificationService` defines appointment notification events.
- `NoOpNotificationService` is the default MVP implementation and does not send external messages.
- `AppointmentService` invokes notifications after successful appointment creation and state transitions.
- `Appointment` remains free of email, WhatsApp, SMS, or infrastructure concerns.
- A future implementation can replace the default bean by providing another `NotificationService`.

Notification events currently exposed:

```text
appointmentRequested
appointmentCreatedByAdmin
appointmentConfirmed
appointmentRejected
appointmentCanceledByClient
appointmentCanceledByAdmin
appointmentCompleted
appointmentMarkedNoShow
appointmentReminderDue
```

Future reminder scheduling can be added with a scheduled job that finds confirmed appointments starting around 24 hours later and calls `appointmentReminderDue`.

## Demo Checklist

1. Start PostgreSQL and create the `appointment_management` database if needed.
2. Start the API with `.\mvnw.cmd spring-boot:run`.
3. Open Swagger UI at <http://localhost:8080/swagger-ui.html>.
4. Log in as admin and authorize Swagger with `Bearer <token>`.
5. Create or verify service, professional, and business hours.
6. Limit the professional to one service with `PUT /api/professionals/{id}/services`.
7. Query availability for an enabled professional-service combination.
8. Query availability for a disabled combination and verify it returns `[]`.
9. Try to create an appointment for the disabled combination and verify the API returns `409 Conflict`.
10. Restore the professional to all services with `mode = ALL_SERVICES`.
11. Register or log in as a client.
12. Create a client appointment and verify it starts as `PENDING`.
13. Confirm the appointment as admin.
14. Try an invalid transition and verify the API returns a conflict error.
15. Query appointment history with filters and pagination.
16. Run `.\mvnw.cmd test`.
17. Run the Postman collection for the automated smoke flow.
