# Plan tecnico de implementacion del backend

Este documento transforma `docs/planning.md` en un plan tecnico accionable para implementar el backend del sistema de gestion de turnos.

El MVP se implementa como sistema de un unico negocio, con roles iniciales `ADMIN` y `CLIENT`, profesionales separados de usuarios, turnos con estados simples mediante enum y disponibilidad calculada dinamicamente sin persistir slots `AVAILABLE`.

## 1. Epics

### Epic 1 - Base tecnica del backend

Preparar el proyecto Spring Boot, configuracion, persistencia, perfiles, documentacion inicial y convenciones de arquitectura.

Alcance:

- Proyecto Spring Boot con Java 17 o 21.
- PostgreSQL como base principal.
- Perfil `dev` para desarrollo local.
- Perfil `test` para tests automatizados.
- Spring Web, Spring Data JPA, Spring Security, Validation, PostgreSQL Driver, SpringDoc OpenAPI y librerias de testing.
- Estructura modular por dominio.
- Manejo global de errores.
- Migraciones versionadas con Flyway o alternativa equivalente.

### Epic 2 - Modelo de dominio y persistencia

Implementar las entidades principales, enums, relaciones y reglas internas basicas del dominio.

Alcance:

- `User`
- `Service`
- `Professional`
- `Appointment`
- `BusinessHours`
- `AvailabilityBlock`
- Enums `UserRole`, `AppointmentStatus`, `CreatedByRole`, `AvailabilityBlockType`.
- Repositorios JPA.
- Migraciones iniciales de tablas, indices y constraints.

### Epic 3 - Autenticacion, autorizacion y usuarios

Permitir registro, login, emision de JWT, proteccion de endpoints y control de permisos por rol.

Alcance:

- Registro publico de clientes.
- Login de usuarios.
- Hash de password.
- JWT.
- Rutas publicas `/auth/**`.
- Rutas protegidas `/api/**`.
- Creacion de usuario `ADMIN` inicial por seed o configuracion.
- Carga administrativa de clientes.

### Epic 4 - Catalogos administrativos

Permitir al administrador configurar servicios, profesionales, horarios laborales y bloqueos de agenda.

Alcance:

- CRUD de servicios.
- CRUD de profesionales.
- CRUD de horarios laborales.
- CRUD de bloqueos de agenda.
- Baja logica mediante `active = false`.
- Validaciones de rangos, duraciones y solapamientos.

### Epic 5 - Gestion de turnos

Implementar el ciclo de vida de los turnos, sus estados y las reglas para crearlos, consultarlos, cancelarlos y cerrarlos.

Alcance:

- Turno creado por `CLIENT` nace en `PENDING`.
- Turno creado por `ADMIN` nace en `CONFIRMED`.
- Confirmacion, rechazo, cancelacion, completado y no asistencia.
- Validacion de transiciones de estado.
- Preservacion de turnos para historial.
- Validacion de disponibilidad antes de crear turnos.

### Epic 6 - Disponibilidad dinamica

Calcular horarios disponibles por dia, profesional y servicio a partir de horarios laborales, turnos activos y bloqueos.

Alcance:

- `AvailabilityService`.
- Consulta de disponibilidad por `professionalId`, `serviceId` y `date`.
- Slots calculados segun `Service.durationMinutes`.
- Exclusion de turnos `PENDING` y `CONFIRMED`.
- Exclusion de bloqueos activos.
- Revalidacion atomica antes de crear turnos.

### Epic 7 - Historial y consultas operativas

Permitir consultar turnos por cliente, profesional, estado y rango de fechas.

Alcance:

- Listado paginado y filtrable de turnos.
- Historial de cliente.
- Agenda e historial de profesional.
- Filtros por estado y fechas.
- Respuestas utiles para frontend administrativo y cliente.

### Epic 8 - Calidad, documentacion y extensibilidad

Dejar el backend mantenible, demostrable y preparado para mejoras futuras.

Alcance:

- Swagger/OpenAPI.
- Tests unitarios e integracion.
- Datos seed/demo.
- README tecnico.
- Preparacion opcional para notificaciones.
- Separacion de efectos secundarios fuera del dominio.

## 2. Features

### Feature 1 - Bootstrap del proyecto

Crear la base del proyecto y dejarlo ejecutable.

Endpoints esperados:

- `GET /actuator/health` si se agrega Actuator.
- Swagger disponible en la ruta configurada por SpringDoc.

Componentes:

- Configuracion de perfiles.
- Conexion PostgreSQL.
- Configuracion de tests.
- Paquetes base:

```text
com.turnos.api
|-- auth
|-- users
|-- services
|-- professionals
|-- appointments
|-- availability
|-- common
|-- config
```

### Feature 2 - Modelo de usuarios

Gestionar usuarios del sistema.

Responsabilidades:

- Representar `ADMIN` y `CLIENT`.
- Garantizar email unico.
- Guardar password como hash.
- Soportar baja logica con `active`.
- Permitir actualizar perfil y password.

Endpoints sugeridos:

- `GET /api/users/me`
- `PATCH /api/users/me`
- `POST /api/users` para carga de clientes por `ADMIN`
- `GET /api/users`
- `GET /api/users/{id}`
- `PATCH /api/users/{id}/deactivate`
- `PATCH /api/users/{id}/activate`

### Feature 3 - Autenticacion JWT

Permitir registro y login.

Endpoints:

```http
POST /auth/register
POST /auth/login
```

Responsabilidades:

- Registrar clientes activos.
- Rechazar emails duplicados.
- Validar credenciales.
- Emitir JWT con identificador y rol.
- Proteger rutas privadas.

### Feature 4 - Servicios

Administrar servicios reservables.

Endpoints sugeridos:

```http
POST /api/services
GET /api/services
GET /api/services/{id}
PUT /api/services/{id}
PATCH /api/services/{id}/activate
PATCH /api/services/{id}/deactivate
```

Reglas:

- `durationMinutes` debe ser mayor a cero.
- Un servicio inactivo no puede reservarse.
- `calculateEndDateTime(startDateTime)` calcula el fin del turno.

### Feature 5 - Profesionales

Administrar profesionales que atienden turnos.

Endpoints sugeridos:

```http
POST /api/professionals
GET /api/professionals
GET /api/professionals/{id}
PUT /api/professionals/{id}
PATCH /api/professionals/{id}/activate
PATCH /api/professionals/{id}/deactivate
```

Reglas:

- Un profesional inactivo no puede recibir nuevos turnos.
- En el MVP `Professional` no tiene login ni relacion obligatoria con `User`.

### Feature 6 - Horarios laborales

Administrar bloques semanales de atencion por profesional.

Endpoints sugeridos:

```http
POST /api/business-hours
GET /api/business-hours
GET /api/business-hours/{id}
PUT /api/business-hours/{id}
PATCH /api/business-hours/{id}/activate
PATCH /api/business-hours/{id}/deactivate
```

Reglas:

- `startTime < endTime`.
- Un bloque pertenece a un profesional y a un dia de la semana.
- No debe haber bloques activos solapados para el mismo profesional y dia.
- Solo bloques activos se usan para disponibilidad.

### Feature 7 - Bloqueos de agenda

Administrar excepciones donde el profesional no esta disponible.

Endpoints sugeridos:

```http
POST /api/availability-blocks
GET /api/availability-blocks
GET /api/availability-blocks/{id}
PUT /api/availability-blocks/{id}
PATCH /api/availability-blocks/{id}/activate
PATCH /api/availability-blocks/{id}/deactivate
```

Reglas:

- `startDateTime < endDateTime`.
- Un bloqueo activo ocupa disponibilidad.
- Un bloqueo inactivo no afecta disponibilidad.
- Debe validarse el impacto sobre turnos activos segun la politica definida para el MVP.

Politica recomendada para MVP:

- Permitir crear bloqueos aunque existan turnos activos superpuestos solo si el endpoint administrativo devuelve una advertencia o si se implementa una validacion explicita.
- Para una primera version mas estricta, rechazar bloqueos que se superpongan con turnos `PENDING` o `CONFIRMED`.

### Feature 8 - Turnos

Administrar reservas y su ciclo de vida.

Endpoints principales:

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

Reglas:

- El cliente del turno debe ser un usuario activo con rol `CLIENT`.
- El servicio debe estar activo y tener duracion valida.
- El profesional debe estar activo.
- El turno no puede estar en el pasado.
- El turno debe entrar completo dentro de un horario laboral activo.
- El turno no puede solaparse con otros turnos `PENDING` o `CONFIRMED`.
- El turno no puede solaparse con bloqueos activos.
- `CLIENT` crea `PENDING`.
- `ADMIN` crea `CONFIRMED`.
- Estados finales no deben transicionar a otros estados.

Transiciones validas:

```text
PENDING -> CONFIRMED
PENDING -> REJECTED
PENDING -> CANCELED_BY_CLIENT
PENDING -> CANCELED_BY_ADMIN
CONFIRMED -> CANCELED_BY_CLIENT
CONFIRMED -> CANCELED_BY_ADMIN
CONFIRMED -> COMPLETED
CONFIRMED -> NO_SHOW
```

Estados que ocupan disponibilidad:

```text
PENDING
CONFIRMED
```

Estados finales:

```text
CANCELED_BY_CLIENT
CANCELED_BY_ADMIN
REJECTED
COMPLETED
NO_SHOW
```

### Feature 9 - Disponibilidad

Calcular slots disponibles sin persistirlos.

Endpoint principal:

```http
GET /api/availability?professionalId=1&serviceId=2&date=2026-05-25
```

Reglas:

- La disponibilidad se calcula por profesional, servicio y dia.
- Cada slot candidato debe durar `service.durationMinutes`.
- El rango completo debe estar dentro de un `BusinessHours` activo.
- Se descartan slots que solapen turnos `PENDING` o `CONFIRMED`.
- Se descartan slots que solapen bloqueos activos.
- Se descartan slots en el pasado.
- Antes de crear un turno se debe revalidar disponibilidad, aunque el cliente haya consultado previamente.

Decision tecnica recomendada:

- Usar la duracion del servicio como granularidad inicial del slot.
- Si mas adelante se necesita ofrecer inicios cada menor intervalo, agregar `slotIntervalMinutes`.

### Feature 10 - Historial

Consultar turnos conservados por distintos criterios.

Consultas principales:

```http
GET /api/appointments?clientId=3
GET /api/appointments?professionalId=2
GET /api/appointments?clientId=3&status=NO_SHOW
GET /api/appointments?professionalId=2&from=2026-05-01&to=2026-05-31
```

Reglas:

- `ADMIN` puede consultar todos los turnos.
- `CLIENT` solo puede consultar sus propios turnos.
- Los filtros deben ser combinables.
- Los resultados deben ser paginables y ordenables.

### Feature 11 - Documentacion y demo

Dejar el proyecto presentable.

Entregables:

- OpenAPI actualizado.
- README con setup, endpoints y reglas principales.
- Datos seed/demo.
- Coleccion de requests opcional.
- Ejemplos de respuestas.

### Feature 12 - Notificaciones basicas preparadas

Separar efectos secundarios de la logica de dominio.

Alcance MVP recomendado:

- Crear interfaz `NotificationService` o dejar el punto de extension documentado.
- No enviar emails reales en la primera version salvo que se decida incluirlo.
- Asegurar que `Appointment` no envie notificaciones.

Eventos futuros:

- Cliente solicita turno.
- Admin confirma turno.
- Turno cancelado.
- Recordatorio 24 horas antes si el turno esta `CONFIRMED`.

## 3. Tareas tecnicas por fase

### Fase 0 - Preparacion del proyecto

Objetivo: dejar lista la base tecnica.

Tareas:

- Crear proyecto Spring Boot.
- Definir Java 17 o 21.
- Agregar dependencias principales.
- Configurar PostgreSQL.
- Configurar perfiles `dev` y `test`.
- Configurar estructura de paquetes.
- Configurar migraciones.
- Agregar SpringDoc OpenAPI.
- Agregar manejo global de errores base.
- Crear README inicial.
- Configurar pipeline local de tests.

Salida esperada:

- La aplicacion compila y levanta.
- El perfil de test corre con base aislada.
- Existe una primera migracion o esquema inicial.

### Fase 1 - Dominio y persistencia

Objetivo: implementar entidades y relaciones.

Tareas:

- Crear enums.
- Crear entidades JPA.
- Implementar metodos de dominio simples:
  - activar/desactivar.
  - validaciones de duracion y rango.
  - calculo de `endDateTime`.
  - solapamientos.
  - transiciones de `Appointment`.
- Crear repositorios.
- Crear migraciones con tablas, foreign keys, indices y constraints.
- Agregar tests unitarios de entidades y reglas puras.

Salida esperada:

- Tablas creadas correctamente.
- Relaciones mapeadas.
- Reglas internas cubiertas con tests unitarios.

### Fase 2 - Seguridad y usuarios

Objetivo: habilitar identidad y permisos.

Tareas:

- Implementar DTOs de registro y login.
- Implementar password hashing.
- Implementar `AuthService`.
- Implementar emision y validacion de JWT.
- Configurar filtros de seguridad.
- Proteger `/api/**`.
- Dejar `/auth/**` publico.
- Crear usuario `ADMIN` inicial.
- Implementar endpoint `me`.
- Implementar carga administrativa de clientes.
- Agregar tests de autenticacion y autorizacion.

Salida esperada:

- Cliente puede registrarse.
- Usuario puede iniciar sesion.
- JWT permite acceder a rutas protegidas.
- Rutas administrativas rechazan usuarios sin rol `ADMIN`.

### Fase 3 - Catalogos administrativos

Objetivo: permitir configuracion del negocio.

Tareas:

- Implementar CRUD de servicios.
- Implementar CRUD de profesionales.
- Implementar CRUD de horarios laborales.
- Implementar CRUD de bloqueos de agenda.
- Agregar DTOs de request/response.
- Agregar validaciones Bean Validation.
- Agregar baja logica.
- Validar solapamiento de horarios laborales activos.
- Validar rango de bloqueos.
- Validar que entidades inactivas no sean ofrecidas para nuevas reservas.
- Agregar tests de controllers o integracion para endpoints administrativos.

Salida esperada:

- `ADMIN` puede configurar el negocio.
- `CLIENT` no puede modificar catalogos.
- Servicios, profesionales, horarios y bloqueos se comportan segun `active`.

### Fase 4 - Turnos

Objetivo: implementar ciclo de vida de reservas.

Tareas:

- Implementar creacion de turnos por cliente.
- Implementar creacion de turnos por admin.
- Calcular `endDateTime` desde la duracion del servicio.
- Validar cliente, servicio y profesional activos.
- Validar horario laboral.
- Validar ausencia de solapamientos con turnos activos.
- Validar ausencia de solapamientos con bloqueos activos.
- Implementar endpoints de transicion:
  - confirmar.
  - rechazar.
  - cancelar por cliente.
  - cancelar por admin.
  - completar.
  - marcar no-show.
- Registrar timestamps correspondientes.
- Agregar manejo de errores de transicion invalida.
- Agregar tests unitarios e integracion.

Salida esperada:

- Turnos creados por clientes nacen `PENDING`.
- Turnos creados por admin nacen `CONFIRMED`.
- Transiciones invalidas son rechazadas.
- Los turnos no se eliminan fisicamente.

### Fase 5 - Disponibilidad

Objetivo: calcular slots dinamicos.

Tareas:

- Implementar `AvailabilityService`.
- Consultar horarios laborales activos del profesional para el dia.
- Consultar turnos activos en el rango del dia.
- Consultar bloqueos activos en el rango del dia.
- Generar candidatos segun duracion del servicio.
- Filtrar candidatos fuera del horario laboral.
- Filtrar candidatos en el pasado.
- Filtrar candidatos solapados con turnos o bloqueos.
- Exponer endpoint `GET /api/availability`.
- Reutilizar la misma validacion antes de crear turnos.
- Agregar tests de escenarios de disponibilidad.

Salida esperada:

- El sistema devuelve slots disponibles reales.
- No hay slots persistidos como `AVAILABLE`.
- La creacion de turnos revalida disponibilidad.

### Fase 6 - Historial y consultas

Objetivo: exponer informacion operativa.

Tareas:

- Implementar filtros combinables en `GET /api/appointments`.
- Soportar filtro por cliente.
- Soportar filtro por profesional.
- Soportar filtro por estado.
- Soportar filtro por rango de fechas.
- Agregar paginacion y orden.
- Aplicar permisos:
  - `ADMIN` ve todos.
  - `CLIENT` ve propios.
- Agregar tests de seguridad y filtros.

Salida esperada:

- Historial de cliente disponible.
- Historial y agenda de profesional disponibles para admin.
- Consultas soportan reportes basicos.

### Fase 7 - Calidad y documentacion

Objetivo: cerrar el MVP con calidad.

Tareas:

- Revisar OpenAPI.
- Completar README.
- Agregar datos seed/demo.
- Agregar ejemplos de request/response.
- Revisar consistencia de errores.
- Revisar nombres de endpoints y DTOs.
- Ejecutar suite completa.
- Preparar checklist de demo.

Salida esperada:

- Backend ejecutable localmente.
- Documentacion suficiente para probarlo.
- Reglas criticas cubiertas por tests.

### Fase 8 - Notificaciones opcionales

Objetivo: dejar preparada la extension sin mezclar responsabilidades.

Tareas:

- Definir interfaz `NotificationService`.
- Agregar implementacion `NoOpNotificationService` para MVP.
- Invocar notificaciones desde servicios de aplicacion, no desde entidades.
- Documentar eventos futuros.
- Evaluar tarea programada para recordatorios 24 horas antes.

Salida esperada:

- El dominio no depende de emails.
- La arquitectura permite agregar notificaciones luego.

## 4. Orden recomendado de implementacion

1. Crear proyecto y configuracion base.
2. Definir estructura de paquetes y convenciones.
3. Implementar migraciones iniciales.
4. Implementar entidades, enums y repositorios.
5. Implementar tests unitarios del dominio.
6. Implementar autenticacion JWT y seguridad.
7. Implementar registro, login y usuario `ADMIN` inicial.
8. Implementar CRUD de servicios.
9. Implementar CRUD de profesionales.
10. Implementar CRUD de horarios laborales.
11. Implementar CRUD de bloqueos de agenda.
12. Implementar reglas de estado de `Appointment`.
13. Implementar creacion de turnos por cliente y admin.
14. Implementar transiciones de turnos.
15. Implementar disponibilidad dinamica.
16. Integrar revalidacion de disponibilidad al crear turnos.
17. Implementar filtros e historial.
18. Agregar OpenAPI, README y datos demo.
19. Completar tests de integracion.
20. Preparar puntos de extension para notificaciones.

## 5. Dependencias entre tareas

| Tarea | Depende de | Motivo |
| --- | --- | --- |
| Configuracion de PostgreSQL | Bootstrap del proyecto | La persistencia necesita datasource y perfiles. |
| Migraciones iniciales | Entidades y relaciones definidas | El esquema debe reflejar el modelo de dominio. |
| Repositorios JPA | Entidades JPA | Los repositorios operan sobre entidades persistibles. |
| Registro y login | `User`, `UserRole`, seguridad base | La autenticacion depende del usuario y sus roles. |
| Proteccion de endpoints | JWT y roles | Los permisos necesitan identidad autenticada. |
| CRUD de servicios | `Service` y repositorio | La administracion depende del catalogo persistido. |
| CRUD de profesionales | `Professional` y repositorio | Los turnos y horarios dependen de profesionales. |
| CRUD de horarios laborales | `Professional`, `BusinessHours` | Cada horario pertenece a un profesional. |
| CRUD de bloqueos | `Professional`, `AvailabilityBlock` | Cada bloqueo pertenece a un profesional. |
| Creacion de turnos | `User`, `Professional`, `Service`, `Appointment` | Un turno necesita cliente, profesional y servicio. |
| Validacion de horario laboral | `BusinessHours` | Solo se puede validar agenda contra horarios cargados. |
| Validacion de bloqueos | `AvailabilityBlock` | Los bloqueos afectan disponibilidad. |
| Validacion de solapamientos | `Appointment` y consultas por rango | Se necesita conocer turnos activos existentes. |
| Disponibilidad dinamica | Servicios, profesionales, horarios, turnos y bloqueos | El calculo combina todas esas fuentes. |
| Historial | Turnos persistidos y seguridad | Las consultas dependen de datos y permisos. |
| OpenAPI completo | Endpoints implementados | La documentacion debe reflejar la API real. |
| Notificaciones | Ciclo de vida de turnos | Los eventos relevantes nacen desde los casos de uso. |

Dependencias criticas:

- `AvailabilityService` no deberia implementarse antes de tener `BusinessHours`, `Appointment` y `AvailabilityBlock`.
- La creacion de turnos debe invocar las mismas reglas de disponibilidad que la consulta de slots.
- La seguridad debe estar disponible antes de exponer operaciones administrativas.
- Las transiciones de `Appointment` deben estar cubiertas con tests antes de conectarlas a controllers.

## 6. Criterios de aceptacion

### Criterios generales del MVP

- El backend levanta correctamente en perfil `dev`.
- La suite de tests corre en perfil `test`.
- Las rutas `/auth/**` son publicas.
- Las rutas `/api/**` requieren autenticacion.
- Las operaciones administrativas requieren rol `ADMIN`.
- Un cliente solo puede operar sobre recursos permitidos para su rol.
- No se persisten slots `AVAILABLE`.
- No se eliminan fisicamente usuarios, servicios, profesionales, horarios, bloqueos ni turnos cuando aplica baja logica o historial.
- Las respuestas de error son consistentes.
- OpenAPI documenta los endpoints principales.

### Usuarios y autenticacion

- Un cliente puede registrarse con email unico.
- No se permite registrar dos usuarios con el mismo email.
- La password nunca se devuelve en respuestas.
- El login devuelve un JWT valido.
- Un usuario inactivo no puede autenticarse ni solicitar turnos.
- Existe al menos un usuario `ADMIN` inicial para operar el sistema.

### Servicios

- `ADMIN` puede crear, editar, activar y desactivar servicios.
- `CLIENT` puede consultar servicios activos.
- No se permite crear servicios con duracion menor o igual a cero.
- Un servicio inactivo no puede usarse para crear turnos.

### Profesionales

- `ADMIN` puede crear, editar, activar y desactivar profesionales.
- `CLIENT` puede consultar profesionales activos si el flujo lo requiere.
- Un profesional inactivo no puede recibir nuevos turnos.

### Horarios laborales

- `ADMIN` puede crear, editar, activar y desactivar horarios.
- No se permiten rangos con `startTime >= endTime`.
- No se permiten horarios activos solapados para el mismo profesional y dia.
- Solo horarios activos se usan para disponibilidad.

### Bloqueos de agenda

- `ADMIN` puede crear, editar, activar y desactivar bloqueos.
- No se permiten bloqueos con `startDateTime >= endDateTime`.
- Un bloqueo activo descarta slots disponibles.
- Un bloqueo inactivo no afecta disponibilidad.
- La politica frente a turnos activos superpuestos queda implementada y testeada.

### Turnos

- `CLIENT` puede solicitar turnos.
- `ADMIN` puede cargar turnos manualmente.
- Turno creado por `CLIENT` queda `PENDING`.
- Turno creado por `ADMIN` queda `CONFIRMED`.
- `endDateTime` se calcula con `service.durationMinutes`.
- No se permiten turnos en el pasado.
- No se permiten turnos fuera del horario laboral.
- No se permiten turnos superpuestos con turnos `PENDING` o `CONFIRMED`.
- No se permiten turnos sobre bloqueos activos.
- Las transiciones invalidas se rechazan con error claro.
- Las transiciones validas registran timestamps y motivos cuando corresponde.
- Los turnos cancelados, rechazados, completados o no-show quedan disponibles para historial.

### Disponibilidad

- El endpoint devuelve slots disponibles para un dia, profesional y servicio.
- Los turnos `PENDING` y `CONFIRMED` ocupan disponibilidad.
- Los bloqueos activos ocupan disponibilidad.
- Los servicios inactivos no generan disponibilidad.
- Los profesionales inactivos no generan disponibilidad.
- Los slots en el pasado no se devuelven.
- Cada slot devuelto entra completo dentro del horario laboral.
- La disponibilidad se revalida al crear el turno.

### Historial

- `ADMIN` puede filtrar turnos por cliente, profesional, estado y rango de fechas.
- `CLIENT` puede consultar su propio historial.
- `CLIENT` no puede consultar turnos de otros clientes.
- Los resultados son paginables y ordenables.

### Documentacion y calidad

- README explica como correr el proyecto.
- README lista reglas principales del dominio.
- OpenAPI permite probar endpoints principales.
- Existen datos demo suficientes para mostrar el flujo.
- Tests criticos pasan localmente.

## 7. Tests recomendados por feature

### Bootstrap del proyecto

Tests recomendados:

- Context load test de Spring.
- Test de conexion a base de datos de test.
- Test de migraciones aplicadas correctamente.

### Usuarios

Tests unitarios:

- `activate()` deja `active = true`.
- `deactivate()` deja `active = false`.
- `updateProfile()` actualiza nombre y telefono.
- `changePassword()` reemplaza hash.
- `isAdmin()` e `isClient()` responden segun rol.
- `canRequestAppointments()` solo devuelve verdadero para `CLIENT` activo.

Tests de integracion:

- Email duplicado devuelve error.
- Usuario inactivo no puede solicitar turno.
- Password hash no se expone en responses.

### Autenticacion JWT

Tests de integracion:

- `POST /auth/register` crea cliente activo.
- `POST /auth/register` rechaza email duplicado.
- `POST /auth/login` devuelve JWT con credenciales validas.
- `POST /auth/login` rechaza password incorrecta.
- Ruta protegida sin token devuelve `401`.
- Ruta admin con rol `CLIENT` devuelve `403`.
- Ruta admin con rol `ADMIN` permite acceso.

### Servicios

Tests unitarios:

- `hasValidDuration()` rechaza duracion cero o negativa.
- `calculateEndDateTime()` suma `durationMinutes`.
- `canBeBooked()` requiere activo y duracion valida.
- `activate()` y `deactivate()` cambian estado.

Tests de integracion:

- `ADMIN` puede crear servicio.
- `CLIENT` no puede crear servicio.
- No se crea servicio con duracion invalida.
- Servicio inactivo no aparece en listados publicos o reservables.
- Servicio inactivo no puede usarse en turno.

### Profesionales

Tests unitarios:

- `canAttendAppointments()` solo devuelve verdadero si esta activo.
- `updateProfile()` actualiza datos basicos.
- `activate()` y `deactivate()` cambian estado.

Tests de integracion:

- `ADMIN` puede crear profesional.
- `CLIENT` no puede crear profesional.
- Profesional inactivo no puede recibir turno.

### Horarios laborales

Tests unitarios:

- `hasValidRange()` requiere `startTime < endTime`.
- `belongsToDay(date)` coincide con `dayOfWeek`.
- `containsRange(startDateTime, endDateTime)` valida inclusion completa.
- `canContainService(startDateTime, service)` usa duracion del servicio.
- `overlapsWith(startTime, endTime)` detecta solapamientos.

Tests de integracion:

- No se permite crear horario con rango invalido.
- No se permite crear horario activo solapado para el mismo profesional y dia.
- Se permite mismo rango para profesionales distintos.
- Horario inactivo no genera disponibilidad.

### Bloqueos de agenda

Tests unitarios:

- `hasValidRange()` requiere `startDateTime < endDateTime`.
- `overlapsWith(startDateTime, endDateTime)` detecta superposiciones.
- `blocksDateTime(dateTime)` detecta una fecha bloqueada.
- `blocksRange(startDateTime, endDateTime)` detecta bloqueo parcial o total.
- `isActive()` refleja estado.

Tests de integracion:

- No se permite crear bloqueo con rango invalido.
- Bloqueo activo elimina slots disponibles.
- Bloqueo inactivo no afecta disponibilidad.
- Crear bloqueo sobre turno activo se comporta segun la politica definida.

### Turnos

Tests unitarios:

- `createRequestedByClient()` crea `PENDING` y `createdByRole = CLIENT`.
- `createConfirmedByAdmin()` crea `CONFIRMED`, `createdByRole = ADMIN` y `confirmedAt`.
- `confirm()` permite `PENDING -> CONFIRMED`.
- `reject(reason)` permite `PENDING -> REJECTED` y guarda motivo.
- `cancelByClient(reason)` permite cancelar `PENDING` y `CONFIRMED`.
- `cancelByAdmin(reason)` permite cancelar `PENDING` y `CONFIRMED`.
- `complete()` permite `CONFIRMED -> COMPLETED`.
- `markNoShow()` permite `CONFIRMED -> NO_SHOW`.
- Transiciones desde estados finales fallan.
- `occupiesAvailability()` solo es verdadero para `PENDING` y `CONFIRMED`.
- `overlapsWith()` aplica la regla `start < requestedEnd && end > requestedStart`.
- `recalculateEndDateTime()` usa duracion del servicio.

Tests de integracion:

- Cliente crea turno en `PENDING`.
- Admin crea turno en `CONFIRMED`.
- No se permite turno en el pasado.
- No se permite turno fuera de horario laboral.
- No se permite turno superpuesto con `PENDING`.
- No se permite turno superpuesto con `CONFIRMED`.
- Se permite turno en horario liberado por cancelacion.
- No se permite turno sobre bloqueo activo.
- Cliente no puede cancelar turno de otro cliente.
- Admin puede cancelar cualquier turno.
- Transicion invalida devuelve error consistente.

### Disponibilidad

Tests unitarios:

- Genera slots dentro de un bloque laboral.
- No genera slots que terminan despues del horario laboral.
- Excluye slots solapados con turnos activos.
- Excluye slots solapados con bloqueos activos.
- Excluye slots en el pasado.
- Usa `durationMinutes` del servicio como duracion del slot.

Tests de integracion:

- `GET /api/availability` devuelve slots para profesional, servicio y fecha validos.
- Servicio inactivo devuelve error o lista vacia segun decision de API.
- Profesional inactivo devuelve error o lista vacia segun decision de API.
- Dia sin horario laboral devuelve lista vacia.
- Turno `CANCELED_BY_CLIENT` no ocupa disponibilidad.
- Turno `REJECTED` no ocupa disponibilidad.
- Turno `COMPLETED` no ocupa disponibilidad historica.
- Crear turno despues de consultar disponibilidad revalida y evita doble reserva.

### Historial

Tests de integracion:

- `ADMIN` filtra por `clientId`.
- `ADMIN` filtra por `professionalId`.
- `ADMIN` filtra por `status`.
- `ADMIN` filtra por rango `from` y `to`.
- Filtros combinados devuelven resultados correctos.
- `CLIENT` consulta sus propios turnos.
- `CLIENT` no consulta turnos ajenos.
- Paginacion y orden funcionan.

### Documentacion y calidad

Tests y verificaciones:

- OpenAPI incluye endpoints principales.
- README contiene pasos para ejecutar localmente.
- Datos seed crean al menos un admin, un servicio, un profesional y horarios.
- Suite completa pasa antes de considerar cerrado el MVP.

### Notificaciones opcionales

Tests unitarios:

- `AppointmentService` invoca `NotificationService` en eventos definidos.
- `Appointment` no depende de `NotificationService`.
- Implementacion `NoOpNotificationService` no rompe flujos del MVP.

## Riesgos tecnicos y decisiones a cerrar temprano

- Definir si los horarios y turnos se guardan con zona horaria o como fecha/hora local del negocio.
- Definir granularidad exacta de slots para disponibilidad. Para MVP se recomienda usar `durationMinutes`.
- Definir respuesta de API para entidades inactivas en disponibilidad: error claro o lista vacia.
- Definir politica de creacion de bloqueos sobre turnos activos. Para MVP se recomienda rechazar solapamientos con `PENDING` o `CONFIRMED`.
- Definir si el `ADMIN` puede crear clientes sin password inicial o si debe generar una invitacion. Para MVP se recomienda permitir carga administrativa con datos minimos y resolver login del cliente en una mejora posterior, o exigir password temporal si el cliente va a ingresar.

