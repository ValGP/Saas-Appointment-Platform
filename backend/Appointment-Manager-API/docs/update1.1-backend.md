# Update 1.1 backend - Relacion profesional-servicio

Este documento define el plan de actualizacion para agregar la relacion entre profesionales y servicios sin romper los CRUD actuales ni bloquear el flujo simple de negocios chicos.

La idea de producto es un modelo hibrido:

- Por defecto, un profesional atiende todos los servicios.
- Opcionalmente, el admin puede limitar un profesional a servicios especificos.
- La asignacion puede gestionarse desde la pantalla de profesionales o desde la pantalla de servicios.
- La creacion de turnos y la disponibilidad deben respetar esa relacion.

## 1. Objetivo

Agregar soporte backend para saber que servicios atiende cada profesional y usar esa regla en:

- Catalogos administrativos.
- Consulta de disponibilidad.
- Creacion de turnos.
- Futuro flujo cliente.

El cambio debe mantener funcionando el caso simple:

```text
Si el admin no configura nada, todos los profesionales pueden atender todos los servicios.
```

## 2. Decision de diseno

La fuente de verdad sera el profesional.

Cada profesional tendra un modo de asignacion:

```text
ALL_SERVICES
SELECTED_SERVICES
```

Regla de habilitacion:

```text
Un profesional puede atender un servicio si:

professional.serviceAssignmentMode = ALL_SERVICES

o

professional.serviceAssignmentMode = SELECTED_SERVICES
y existe una relacion professional_services(professional_id, service_id)
```

Esto evita que el admin tenga que asignar servicios manualmente cuando el negocio es chico o cuando todos atienden todo.

## 3. Modelo de datos

### 3.1 Cambios en professionals

Agregar columna:

```text
service_assignment_mode VARCHAR(30) NOT NULL DEFAULT 'ALL_SERVICES'
```

Valores permitidos:

```text
ALL_SERVICES
SELECTED_SERVICES
```

### 3.2 Nueva tabla professional_services

```text
professional_services
- professional_id BIGINT NOT NULL
- service_id BIGINT NOT NULL
- created_at TIMESTAMP NOT NULL
```

Constraints:

```text
PRIMARY KEY (professional_id, service_id)
FOREIGN KEY professional_id -> professionals(id)
FOREIGN KEY service_id -> services(id)
```

Indices sugeridos:

```text
idx_professional_services_professional_id
idx_professional_services_service_id
```

### 3.3 Diagrama de relacion

```mermaid
erDiagram
    PROFESSIONALS ||--o{ BUSINESS_HOURS : has
    PROFESSIONALS ||--o{ AVAILABILITY_BLOCKS : has
    PROFESSIONALS ||--o{ APPOINTMENTS : attends
    SERVICES ||--o{ APPOINTMENTS : booked_as
    APP_USERS ||--o{ APPOINTMENTS : requests
    PROFESSIONALS ||--o{ PROFESSIONAL_SERVICES : limits
    SERVICES ||--o{ PROFESSIONAL_SERVICES : allowed_for

    PROFESSIONALS {
        bigint id
        string full_name
        string email
        string phone
        boolean active
        string service_assignment_mode
    }

    SERVICES {
        bigint id
        string name
        int duration_minutes
        decimal price
        boolean active
    }

    PROFESSIONAL_SERVICES {
        bigint professional_id
        bigint service_id
        timestamp created_at
    }
```

## 4. Contratos de API

Los CRUD actuales se mantienen:

```http
POST /api/professionals
GET /api/professionals
GET /api/professionals/{id}
PUT /api/professionals/{id}
PATCH /api/professionals/{id}/activate
PATCH /api/professionals/{id}/deactivate

POST /api/services
GET /api/services
GET /api/services/{id}
PUT /api/services/{id}
PATCH /api/services/{id}/activate
PATCH /api/services/{id}/deactivate
```

La asignacion se maneja con endpoints nuevos para no mezclar alta/edicion basica con configuracion avanzada.

### 4.1 Asignar servicios a un profesional

```http
PUT /api/professionals/{id}/services
```

Request:

```json
{
  "mode": "SELECTED_SERVICES",
  "serviceIds": [1, 2, 5]
}
```

Para volver al modo simple:

```json
{
  "mode": "ALL_SERVICES",
  "serviceIds": []
}
```

Response sugerida:

```json
{
  "professionalId": 1,
  "mode": "SELECTED_SERVICES",
  "services": [
    {
      "id": 1,
      "name": "Limpieza facial",
      "active": true
    }
  ]
}
```

### 4.2 Consultar servicios asignados a un profesional

```http
GET /api/professionals/{id}/services
```

Response:

```json
{
  "professionalId": 1,
  "mode": "ALL_SERVICES",
  "services": []
}
```

Nota:

- Si `mode = ALL_SERVICES`, `services` puede venir vacio porque no hace falta guardar todos los servicios.
- El frontend puede mostrar "Todos los servicios".

### 4.3 Asignar profesionales a un servicio

```http
PUT /api/services/{id}/professionals
```

Request:

```json
{
  "mode": "SELECTED_PROFESSIONALS",
  "professionalIds": [1, 3]
}
```

Para dejar el servicio disponible para todos los profesionales compatibles:

```json
{
  "mode": "ALL_PROFESSIONALS",
  "professionalIds": []
}
```

Importante:

- Internamente la fuente de verdad sigue siendo el profesional.
- Este endpoint funciona como un atajo administrativo desde la pantalla de servicios.
- Si se usa `SELECTED_PROFESSIONALS`, el backend debe actualizar las asignaciones de los profesionales afectados de forma consistente.
- En esta implementacion, `SELECTED_PROFESSIONALS` deja habilitado el servicio solo para los profesionales elegidos. Si un profesional no elegido estaba en `ALL_SERVICES`, pasa a `SELECTED_SERVICES` conservando asignados los otros servicios actuales.
- En esta implementacion, `ALL_PROFESSIONALS` habilita el servicio para todos los profesionales actuales. Los profesionales que ya estan en `ALL_SERVICES` no necesitan filas extra; los que estan en `SELECTED_SERVICES` reciben una asignacion explicita para ese servicio.

### 4.4 Consultar profesionales que atienden un servicio

```http
GET /api/services/{id}/professionals
```

Response:

```json
{
  "serviceId": 1,
  "mode": "ALL_PROFESSIONALS",
  "professionals": [
    {
      "id": 1,
      "fullName": "Ana Gomez",
      "active": true,
      "serviceAssignmentMode": "ALL_SERVICES"
    }
  ]
}
```

### 4.5 Consulta filtrada para futuro flujo cliente

Endpoints recomendados para simplificar frontend:

```http
GET /api/professionals?serviceId=1
GET /api/services?professionalId=1
```

Reglas:

- Si no hay filtro, mantienen el comportamiento actual.
- Con filtro, devuelven solo combinaciones habilitadas.
- Para flujo cliente/publico, conviene devolver solo activos.
- Para admin, puede hacer falta incluir inactivos segun la pantalla.
- En esta implementacion admin, los listados filtrados mantienen el criterio de catalogo administrativo: pueden incluir entidades inactivas si son compatibles. El filtrado publico/cliente deberia restringir a activos cuando se exponga.

## 5. Reglas de negocio

### 5.1 Profesional en ALL_SERVICES

```text
Puede atender cualquier servicio activo.
No requiere filas en professional_services.
```

### 5.2 Profesional en SELECTED_SERVICES

```text
Solo puede atender servicios presentes en professional_services.
Si serviceIds esta vacio, no atiende ningun servicio.
```

### 5.3 Servicio o profesional inactivo

Aunque la relacion exista:

```text
Servicio inactivo no puede reservarse.
Profesional inactivo no puede recibir turnos.
```

### 5.4 Turnos existentes

Cambiar asignaciones no debe borrar ni modificar turnos historicos.

Politica recomendada para MVP:

- No impedir cambiar asignaciones aunque existan turnos futuros.
- Pero al sacar un servicio a un profesional con turnos `PENDING` o `CONFIRMED`, devolver advertencia en una mejora posterior.
- Para esta actualizacion, validar solo nuevas creaciones y nueva disponibilidad.

## 6. Impacto en disponibilidad y turnos

### 6.1 Creacion de turnos

Antes de crear el turno, validar:

```text
professionalId + serviceId esta habilitado
```

Si no esta habilitado:

```http
409 Conflict
```

Mensaje sugerido:

```text
Professional does not provide the selected service
```

Esta validacion debe correr tanto para turnos creados por `CLIENT` como para turnos creados por `ADMIN`.

### 6.2 GET /api/availability

El endpoint actual:

```http
GET /api/availability?professionalId=1&serviceId=2&date=2026-05-27
```

Debe validar la combinacion antes de calcular slots.

Decision recomendada:

- Para combinacion no habilitada, devolver `200 OK` con `[]`.
- Para IDs inexistentes, mantener `404`.
- Para servicio/profesional inactivo, devolver `[]` o error segun la regla actual del backend.

Motivo:

```text
En flujo cliente, una combinacion no habilitada equivale a "no hay disponibilidad".
En creacion de turno, la misma combinacion debe rechazarse con 409.
```

## 7. Plan por fases

### Fase 1 - Dominio y migracion

Objetivo: agregar el modelo sin tocar todavia los flujos de turnos.

Checklist:

- [x] Crear enum `ServiceAssignmentMode`.
- [x] Agregar `serviceAssignmentMode` a `Professional`.
- [x] Crear entidad `ProfessionalServiceAssignment` con entidad explicita para la tabla intermedia.
- [x] Crear migracion Flyway para columna y tabla intermedia.
- [x] Agregar repositorio para consultar asignaciones.
- [x] Agregar metodos de dominio:
  - [x] `Professional.attendsAllServices()`
  - [x] `Professional.usesSelectedServices()`
  - [x] `Professional.setAllServices()`
  - [x] `Professional.setSelectedServices()`
- [x] Tests unitarios del modo de asignacion.
- [x] Test de persistencia de asignaciones.

Criterio de cierre:

```text
La app compila, migraciones corren y un profesional nuevo queda en ALL_SERVICES por defecto.
```

### Fase 2 - Servicio de compatibilidad

Objetivo: centralizar la regla professionalId + serviceId.

Checklist:

- [x] Crear `ProfessionalServiceAssignmentService` o nombre equivalente.
- [x] Implementar `canProfessionalProvideService(professionalId, serviceId)`.
- [x] Implementar `ensureProfessionalProvidesService(professionalId, serviceId)`.
- [x] Implementar consultas:
  - [x] servicios habilitados por profesional.
  - [x] profesionales habilitados por servicio.
- [x] Cubrir casos:
  - [x] profesional `ALL_SERVICES`.
  - [x] profesional `SELECTED_SERVICES` con servicio asignado.
  - [x] profesional `SELECTED_SERVICES` sin servicio asignado.
  - [x] servicio/profesional inexistente.
  - [x] servicio/profesional inactivo.

Criterio de cierre:

```text
Existe un unico lugar en backend que decide si una combinacion profesional-servicio es valida.
```

### Fase 3 - Endpoints por profesional

Objetivo: permitir administrar servicios desde la ficha del profesional.

Checklist:

- [x] Crear request `ProfessionalServicesAssignmentRequest`.
- [x] Crear response `ProfessionalServicesAssignmentResponse`.
- [x] Implementar `GET /api/professionals/{id}/services`.
- [x] Implementar `PUT /api/professionals/{id}/services`.
- [x] Validar rol `ADMIN`.
- [x] Validar serviceIds existentes.
- [x] Si `mode = ALL_SERVICES`, limpiar asignaciones manuales.
- [x] Si `mode = SELECTED_SERVICES`, reemplazar asignaciones por `serviceIds`.
- [x] Tests de controller:
  - [x] admin asigna servicios.
  - [x] admin vuelve a todos los servicios.
  - [x] client recibe `403`.
  - [x] serviceId inexistente devuelve `404` o `400` consistente.

Criterio de cierre:

```text
El admin puede limitar un profesional a servicios especificos sin modificar el CRUD principal.
```

### Fase 4 - Endpoints por servicio

Objetivo: permitir administrar profesionales desde la ficha del servicio.

Checklist:

- [x] Crear request `ServiceProfessionalsAssignmentRequest`.
- [x] Crear response `ServiceProfessionalsAssignmentResponse`.
- [x] Implementar `GET /api/services/{id}/professionals`.
- [x] Implementar `PUT /api/services/{id}/professionals`.
- [x] Definir comportamiento de `ALL_PROFESSIONALS`.
- [x] Definir comportamiento de `SELECTED_PROFESSIONALS`.
- [x] Validar professionalIds existentes.
- [x] Tests de controller:
  - [x] admin asigna profesionales a servicio.
  - [x] admin vuelve a todos los profesionales compatibles.
  - [x] client recibe `403`.

Criterio de cierre:

```text
El admin puede gestionar la relacion desde servicios sin que el frontend tenga que conocer detalles internos de la tabla intermedia.
```

### Fase 5 - Filtros para frontend

Objetivo: preparar agenda, disponibilidad y flujo cliente.

Checklist:

- [x] Agregar filtro opcional `serviceId` a `GET /api/professionals`.
- [x] Agregar filtro opcional `professionalId` a `GET /api/services`.
- [x] Decidir si estos listados admin muestran inactivos o solo activos.
- [x] Tests:
  - [x] `GET /api/professionals?serviceId=1` respeta `ALL_SERVICES`.
  - [x] respeta `SELECTED_SERVICES`.
  - [x] no devuelve profesionales incompatibles.
  - [x] `GET /api/services?professionalId=1` respeta el modo del profesional.

Criterio de cierre:

```text
El frontend puede pedir opciones validas sin duplicar reglas de negocio.
```

### Fase 6 - Validacion en turnos

Objetivo: impedir reservas con combinaciones no habilitadas.

Checklist:

- [x] Inyectar el servicio de compatibilidad en `AppointmentService`.
- [x] Validar combinacion antes de crear turno por cliente.
- [x] Validar combinacion antes de crear turno por admin.
- [x] Reusar error `ConflictException`.
- [x] Tests:
  - [x] `ALL_SERVICES` permite crear turno.
  - [x] `SELECTED_SERVICES` con servicio asignado permite crear turno.
  - [x] `SELECTED_SERVICES` sin servicio asignado rechaza con `409`.
  - [x] profesional/servicio inactivo sigue rechazando segun reglas existentes.

Criterio de cierre:

```text
No se puede crear un turno con professionalId + serviceId incompatible.
```

### Fase 7 - Integracion con disponibilidad

Objetivo: que los slots disponibles respeten la relacion.

Checklist:

- [x] Inyectar el servicio de compatibilidad en `AvailabilityService`.
- [x] Antes de calcular slots, verificar combinacion.
- [x] Para combinacion no habilitada, devolver lista vacia.
- [x] Tests:
  - [x] `ALL_SERVICES` devuelve slots si hay horario.
  - [x] `SELECTED_SERVICES` asignado devuelve slots.
  - [x] `SELECTED_SERVICES` no asignado devuelve `[]`.
  - [x] no cambia la logica de bloqueos, horarios ni turnos activos.

Criterio de cierre:

```text
GET /api/availability ya no ofrece horarios para servicios que el profesional no atiende.
```

### Fase 8 - Documentacion y contrato final

Objetivo: dejar trazabilidad para frontend y pruebas manuales.

Checklist:

- [x] Actualizar README o documentacion de endpoints.
- [x] Revisar coleccion Postman existente; se mantiene como smoke general y el contrato nuevo queda documentado en README/OpenAPI.
- [x] Agregar ejemplos de requests/responses.
- [x] Ejecutar suite completa `mvn test`.
- [x] Probar flujo admin con tests de integracion:
  - [x] crear servicio.
  - [x] crear profesional.
  - [x] limitar profesional a un servicio.
  - [x] consultar disponibilidad habilitada.
  - [x] consultar disponibilidad no habilitada.
  - [x] intentar crear turno invalido.

Criterio de cierre:

```text
Backend listo para que frontend admin agregue UI de asignaciones y para que flujo cliente consuma opciones compatibles.
```

## 8. Flujo recomendado de implementacion

```mermaid
flowchart TD
    A["Fase 1: Dominio y migracion"] --> B["Fase 2: Servicio de compatibilidad"]
    B --> C["Fase 3: Endpoints por profesional"]
    C --> D["Fase 4: Endpoints por servicio"]
    D --> E["Fase 5: Filtros para frontend"]
    E --> F["Fase 6: Validacion en turnos"]
    F --> G["Fase 7: Disponibilidad"]
    G --> H["Fase 8: Documentacion y pruebas"]
```

## 9. Riesgos y decisiones a cuidar

### 9.1 Endpoint por servicio puede ser mas complejo

Editar profesionales desde un servicio puede afectar varios profesionales a la vez.

Recomendacion:

- Implementar primero endpoints por profesional.
- Luego agregar endpoints por servicio como atajo.
- Mantener tests claros para no generar cambios silenciosos inesperados.

### 9.2 ALL_SERVICES no debe crear filas masivas

No conviene guardar una fila por cada servicio cuando el profesional atiende todos.

Regla:

```text
ALL_SERVICES significa "sin limite manual".
professional_services se usa solo para SELECTED_SERVICES.
```

### 9.3 Cambios en asignaciones no deben romper historial

Los turnos ya creados representan lo que paso o lo que estaba pactado.

Regla:

```text
La relacion profesional-servicio valida nuevas disponibilidades y nuevas reservas.
No reescribe turnos existentes.
```

### 9.4 Frontend no debe duplicar reglas criticas

El frontend puede filtrar para mejorar experiencia, pero el backend siempre valida.

Regla:

```text
El backend es la autoridad final sobre si professionalId + serviceId esta habilitado.
```

## 10. Criterios de aceptacion generales

- [x] Un profesional nuevo atiende todos los servicios por defecto.
- [x] El admin puede cambiar un profesional a servicios seleccionados.
- [x] El admin puede volver un profesional a todos los servicios.
- [x] El admin puede consultar que servicios atiende un profesional.
- [x] El admin puede consultar que profesionales atienden un servicio.
- [x] Crear turno con combinacion invalida devuelve `409`.
- [x] `GET /api/availability` no devuelve slots para combinaciones invalidas.
- [x] Los CRUD actuales de servicios y profesionales siguen funcionando.
- [x] Los tests existentes siguen pasando.
- [x] Hay tests nuevos para asignaciones, turnos y disponibilidad.

## 11. Contrato minimo para frontend

Para avanzar con frontend despues de este update, el backend deberia garantizar:

```http
GET /api/professionals/{id}/services
PUT /api/professionals/{id}/services
GET /api/services/{id}/professionals
PUT /api/services/{id}/professionals
GET /api/professionals?serviceId={serviceId}
GET /api/services?professionalId={professionalId}
```

Y en responses de profesionales, agregar al menos:

```json
{
  "id": 1,
  "fullName": "Ana Gomez",
  "email": "ana@email.com",
  "phone": "123",
  "active": true,
  "serviceAssignmentMode": "ALL_SERVICES"
}
```

En responses de servicios puede agregarse informacion resumida opcional:

```json
{
  "id": 1,
  "name": "Limpieza facial",
  "durationMinutes": 60,
  "price": 25000,
  "active": true,
  "assignedProfessionalsCount": 2
}
```

## 12. Orden sugerido de commits

1. `backend: add professional service assignment model`
2. `backend: add assignment compatibility service`
3. `backend: add professional service assignment endpoints`
4. `backend: add service professional assignment endpoints`
5. `backend: filter services and professionals by compatibility`
6. `backend: validate service compatibility in appointments`
7. `backend: apply service compatibility to availability`
8. `backend: document professional service assignment API`
