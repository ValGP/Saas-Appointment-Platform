# Sistema de Gestión de Turnos — Backend

## 1. Idea general

El proyecto consiste en desarrollar el backend de un sistema de gestión de turnos para un negocio o profesional que atiende clientes mediante reservas programadas.

El caso inicial puede pensarse para rubros como:

- Estética
- Barbería / peluquería
- Consultorio
- Kinesiología
- Taller
- Clases particulares

La idea del MVP es que un negocio pueda cargar servicios, profesionales y horarios de atención, y que los clientes puedan reservar turnos disponibles.

---

## 2. Objetivo del MVP

El MVP debe permitir:

- Registrar usuarios.
- Autenticar usuarios mediante login.
- Administrar servicios ofrecidos por el negocio.
- Administrar profesionales que atienden turnos.
- Crear, consultar y cancelar turnos.
- Validar que no existan turnos superpuestos.
- Validar que los turnos estén dentro del horario laboral.
- Consultar disponibilidad por día, profesional y servicio.
- Calcular dinámicamente los horarios disponibles sin guardar turnos en estado `AVAILABLE`.
- Consultar el historial de turnos de clientes y profesionales.

---

## 3. Roles iniciales

Para una primera versión simple se pueden usar dos roles:

```text
ADMIN
CLIENT
```

Más adelante se puede agregar:

```text
PROFESSIONAL
```

### Descripción de roles

#### ADMIN

Usuario administrador del negocio. Puede gestionar servicios, profesionales, horarios y turnos.

#### CLIENT

Usuario cliente. Puede registrarse, iniciar sesión, ver servicios disponibles y reservar turnos.

#### PROFESSIONAL

Usuario profesional. Podría consultar sus propios turnos, disponibilidad y agenda. Este rol puede agregarse en una etapa posterior.

---

## 4. Entidades principales

## 4.1 User

Representa a un usuario del sistema.

```text
User
- id
- fullName
- email
- passwordHash
- phone
- role
- active
- createdAt

Métodos
+ activate()
+ deactivate()
+ updateProfile(fullName, phone)
+ changePassword(newPasswordHash)
+ isAdmin()
+ isClient()
+ canRequestAppointments()
```

### Observaciones

- El campo `email` debería ser único.
- La contraseña no se guarda en texto plano, sino como hash.
- El campo `role` define los permisos del usuario.
- `active` permite realizar baja lógica.

### 4.1.1 Métodos

#### activate()

Activa nuevamente al usuario. Sirve para revertir una baja lógica.

#### deactivate()

Desactiva al usuario sin eliminarlo físicamente de la base de datos.

#### updateProfile(fullName, phone)

Actualiza datos básicos del perfil del usuario, como nombre completo y teléfono.

#### changePassword(newPasswordHash)

Actualiza la contraseña del usuario guardando el nuevo hash. El método no recibe la contraseña en texto plano.

#### isAdmin()

Devuelve si el usuario tiene rol `ADMIN`. Sirve para validar permisos dentro de reglas de negocio.

#### isClient()

Devuelve si el usuario tiene rol `CLIENT`.

#### canRequestAppointments()

Indica si el usuario puede solicitar turnos. En principio, debería devolver verdadero para usuarios activos con rol `CLIENT`.

---

## 4.2 Service

Representa un servicio ofrecido por el negocio.

Ejemplos:

- Corte de pelo
- Manicura
- Consulta inicial
- Sesión de kinesiología

```text
Service
- id
- name
- description
- durationMinutes
- price
- active

Métodos
+ activate()
+ deactivate()
+ updateDetails(name, description, durationMinutes, price)
+ calculateEndDateTime(startDateTime)
+ hasValidDuration()
+ canBeBooked()
```

### Observaciones

- `durationMinutes` permite calcular automáticamente la hora de finalización del turno.
- `price` puede ser opcional al principio, pero suma valor para el proyecto.
- `active` permite ocultar servicios sin eliminarlos físicamente.

### 4.2.1 Métodos

#### activate()

Activa nuevamente el servicio para que pueda ser reservado.

#### deactivate()

Desactiva el servicio sin eliminarlo físicamente. Un servicio inactivo no debería aparecer disponible para nuevos turnos.

#### updateDetails(name, description, durationMinutes, price)

Actualiza los datos principales del servicio.

#### calculateEndDateTime(startDateTime)

Calcula la fecha y hora de finalización de un turno a partir del inicio y de `durationMinutes`.

#### hasValidDuration()

Valida que la duración del servicio sea mayor a cero.

#### canBeBooked()

Indica si el servicio puede ser reservado. En principio, debería devolver verdadero si el servicio está activo y tiene una duración válida.

---

## 4.3 Professional

Representa a una persona que atiende turnos.

```text
Professional
- id
- fullName
- email
- phone
- active

Métodos
+ activate()
+ deactivate()
+ updateProfile(fullName, email, phone)
+ canAttendAppointments()
```

### Observaciones

- En una primera versión, `Professional` puede ser una entidad separada de `User`.
- Más adelante podría vincularse con `User` si los profesionales van a iniciar sesión.

### 4.3.1 Métodos

#### activate()

Activa nuevamente al profesional para que pueda recibir turnos.

#### deactivate()

Desactiva al profesional sin eliminarlo físicamente. Un profesional inactivo no debería aparecer como opción para nuevos turnos.

#### updateProfile(fullName, email, phone)

Actualiza los datos básicos del profesional.

#### canAttendAppointments()

Indica si el profesional puede recibir turnos. En principio, debería devolver verdadero si el profesional está activo.

---

## 4.4 Appointment

Representa el turno reservado.

```text
Appointment
- id
- client: User
- professional: Professional
- service: Service
- startDateTime
- endDateTime
- status
- notes
- cancelReason
- rejectionReason
- createdByRole
- confirmedAt
- canceledAt
- completedAt
- noShowAt
- createdAt
- updatedAt

Métodos
+ createRequestedByClient(client, professional, service, startDateTime)
+ createConfirmedByAdmin(client, professional, service, startDateTime)
+ confirm()
+ reject(reason)
+ cancelByClient(reason)
+ cancelByAdmin(reason)
+ complete()
+ markNoShow()
+ occupiesAvailability()
+ isFinalStatus()
+ isPending()
+ isConfirmed()
+ overlapsWith(startDateTime, endDateTime)
+ recalculateEndDateTime()
```

### Observaciones

- `client` representa al usuario que reserva el turno.
- `professional` representa al profesional que atiende.
- `service` representa el servicio elegido.
- `endDateTime` puede calcularse usando `startDateTime + durationMinutes`.
- `status` indica el estado actual del turno.
- `cancelReason` se completa si el turno fue cancelado.

### 4.4.1 Métodos

#### createRequestedByClient(client, professional, service, startDateTime)

Crea un turno solicitado por un cliente. Debe calcular automáticamente `endDateTime` usando la duración del servicio y dejar el estado inicial en `PENDING`.

```text
createdByRole = CLIENT
status = PENDING
```

#### createConfirmedByAdmin(client, professional, service, startDateTime)

Crea un turno cargado manualmente por el administrador. Debe calcular automáticamente `endDateTime` usando la duración del servicio y dejar el estado inicial en `CONFIRMED`.

```text
createdByRole = ADMIN
status = CONFIRMED
confirmedAt = fecha y hora actual
```

#### confirm()

Confirma un turno pendiente.

Transición válida:

```text
PENDING -> CONFIRMED
```

Debe registrar `confirmedAt`.

#### reject(reason)

Rechaza una solicitud pendiente.

Transición válida:

```text
PENDING -> REJECTED
```

Debe guardar `rejectionReason`.

#### cancelByClient(reason)

Cancela el turno por acción del cliente.

Transiciones válidas:

```text
PENDING -> CANCELED_BY_CLIENT
CONFIRMED -> CANCELED_BY_CLIENT
```

Debe guardar `cancelReason` y `canceledAt`.

#### cancelByAdmin(reason)

Cancela el turno por acción del administrador.

Transiciones válidas:

```text
PENDING -> CANCELED_BY_ADMIN
CONFIRMED -> CANCELED_BY_ADMIN
```

Debe guardar `cancelReason` y `canceledAt`.

#### complete()

Marca el turno como realizado.

Transición válida:

```text
CONFIRMED -> COMPLETED
```

Debe guardar `completedAt`.

#### markNoShow()

Marca que el cliente no asistió al turno.

Transición válida:

```text
CONFIRMED -> NO_SHOW
```

Debe guardar `noShowAt`.

#### occupiesAvailability()

Indica si el turno ocupa un horario en la agenda.

Debe devolver verdadero para:

```text
PENDING
CONFIRMED
```

Debe devolver falso para:

```text
CANCELED_BY_CLIENT
CANCELED_BY_ADMIN
REJECTED
COMPLETED
NO_SHOW
```

#### isFinalStatus()

Indica si el turno está en un estado final.

#### isPending()

Devuelve si el turno está en estado `PENDING`.

#### isConfirmed()

Devuelve si el turno está en estado `CONFIRMED`.

#### overlapsWith(startDateTime, endDateTime)

Indica si el turno se superpone con otro rango horario. Sirve para validar disponibilidad.

Regla general de superposición:

```text
appointment.startDateTime < requestedEndDateTime
AND
appointment.endDateTime > requestedStartDateTime
```

#### recalculateEndDateTime()

Recalcula `endDateTime` usando `startDateTime` y `service.durationMinutes`. Sirve si se modifica el servicio o la hora de inicio antes de confirmar cambios.

### 4.4.2 Aclaración sobre patrón State

Para el MVP no se implementará el patrón State en `Appointment`.

La entidad `Appointment` mantendrá un atributo simple:

```text
status: AppointmentStatus
```

Y tendrá métodos de transición como:

```text
confirm()
reject(reason)
cancelByClient(reason)
cancelByAdmin(reason)
complete()
markNoShow()
```

Estos métodos serán responsables de validar si una transición es permitida y actualizar los campos internos correspondientes, por ejemplo `confirmedAt`, `canceledAt`, `completedAt` o `noShowAt`.

El patrón State podría considerarse más adelante si la lógica de estados crece demasiado o si cada estado empieza a tener comportamientos muy distintos. Para la primera versión, usar un enum con métodos de transición en la entidad resulta más simple y suficiente.

---

## 4.5 BusinessHours

Representa los horarios laborales de un profesional.

```text
BusinessHours
- id
- professional: Professional
- dayOfWeek
- startTime
- endTime
- active

Métodos
+ activate()
+ deactivate()
+ updateHours(dayOfWeek, startTime, endTime)
+ belongsToDay(date)
+ containsRange(startDateTime, endDateTime)
+ canContainService(startDateTime, service)
+ hasValidRange()
+ overlapsWith(startTime, endTime)
```

Ejemplo:

```text
MONDAY    09:00 - 18:00
TUESDAY   09:00 - 18:00
WEDNESDAY 09:00 - 13:00
```

### Observaciones

- Un profesional puede tener distintos horarios según el día.
- Permite validar si un turno cae dentro del horario de atención.
- También sirve para calcular disponibilidad.

### 4.5.1 Métodos

#### activate()

Activa el bloque de horario laboral para que sea tenido en cuenta al calcular disponibilidad.

#### deactivate()

Desactiva el bloque de horario laboral sin eliminarlo físicamente. Un horario laboral inactivo no debe usarse para ofrecer turnos.

#### updateHours(dayOfWeek, startTime, endTime)

Actualiza el día y rango horario del bloque laboral.

#### belongsToDay(date)

Indica si este horario laboral corresponde al día de la fecha consultada.

#### containsRange(startDateTime, endDateTime)

Valida si un rango de fecha y hora completo entra dentro del horario laboral.

Ejemplo:

```text
Horario laboral: 09:00 - 13:00
Turno solicitado: 10:00 - 11:00
Resultado = true
```

#### canContainService(startDateTime, service)

Valida si un servicio puede realizarse comenzando en una fecha y hora determinada.

Internamente calcula:

```text
endDateTime = startDateTime + service.durationMinutes
```

Luego verifica si el rango completo entra dentro del horario laboral.

#### hasValidRange()

Valida que el horario laboral tenga un rango correcto.

Regla:

```text
startTime < endTime
```

#### overlapsWith(startTime, endTime)

Indica si este horario laboral se superpone con otro rango horario del mismo día.

Sirve para evitar cargar horarios inconsistentes para un mismo profesional, por ejemplo:

```text
09:00 - 13:00
12:00 - 16:00
```

---

## 4.6 AvailabilityBlock

Representa un bloqueo de agenda para un profesional. Se usa cuando el profesional no está disponible en un rango específico, aunque normalmente trabajaría en ese horario.

```text
AvailabilityBlock
- id
- professional: Professional
- startDateTime
- endDateTime
- reason
- type
- active
- createdAt

Métodos
+ activate()
+ deactivate()
+ updateBlock(startDateTime, endDateTime, reason, type)
+ hasValidRange()
+ overlapsWith(startDateTime, endDateTime)
+ blocksDateTime(dateTime)
+ blocksRange(startDateTime, endDateTime)
+ isActive()
```

### Observaciones

- Un bloqueo activo ocupa disponibilidad.
- No representa un turno, sino una excepción en la agenda.
- Sirve para vacaciones, enfermedad, feriados, cierres del negocio o bloqueos manuales.

### 4.6.1 Métodos

#### activate()

Activa el bloqueo para que vuelva a afectar la disponibilidad.

#### deactivate()

Desactiva el bloqueo sin eliminarlo físicamente. Un bloqueo inactivo no debe afectar la disponibilidad.

#### updateBlock(startDateTime, endDateTime, reason, type)

Actualiza el rango, motivo y tipo del bloqueo.

#### hasValidRange()

Valida que el bloqueo tenga un rango horario correcto.

Regla:

```text
startDateTime < endDateTime
```

#### overlapsWith(startDateTime, endDateTime)

Indica si el bloqueo se superpone con un rango horario solicitado.

Sirve para saber si un horario calculado como disponible debe descartarse.

#### blocksDateTime(dateTime)

Indica si una fecha y hora puntual cae dentro del bloqueo.

#### blocksRange(startDateTime, endDateTime)

Indica si el bloqueo afecta un rango completo o parcial.

Ejemplo:

```text
Bloqueo: 12:00 - 14:00
Turno solicitado: 13:00 - 13:30
Resultado = true
```

#### isActive()

Devuelve si el bloqueo está activo.

---

## 5. Relaciones y cardinalidades

## 5.1 User — Appointment

```text
User 1 ─────────── 0..* Appointment
```

Un usuario cliente puede tener cero, uno o muchos turnos.

Cada turno pertenece a un único cliente.

---

## 5.2 Professional — Appointment

```text
Professional 1 ─── 0..* Appointment
```

Un profesional puede atender cero, uno o muchos turnos.

Cada turno es atendido por un único profesional.

---

## 5.3 Service — Appointment

```text
Service 1 ──────── 0..* Appointment
```

Un servicio puede estar asociado a cero, uno o muchos turnos.

Cada turno corresponde a un único servicio.

---

## 5.4 Professional — BusinessHours

```text
Professional 1 ─── 0..* BusinessHours
```

Un profesional puede tener cero, uno o muchos bloques de horario laboral.

Cada bloque horario pertenece a un único profesional.

---

## 5.5 Professional — AvailabilityBlock

```text
Professional 1 ─── 0..* AvailabilityBlock
```

Un profesional puede tener cero, uno o muchos bloqueos de agenda.

Cada bloqueo de agenda pertenece a un único profesional.

---

## 6. Diagrama de clases en modo texto

```text
User
  1
  |
  | tiene
  |
  0..*
Appointment
  * ───────── 1 Professional
  |
  |
  * ───────── 1 Service


Professional
  1
  |
  | tiene
  |
  0..*
BusinessHours

Professional
  1
  |
  | tiene
  |
  0..*
AvailabilityBlock
```

Otra forma de verlo:

```text
User 1 ─────────────── 0..* Appointment
Professional 1 ─────── 0..* Appointment
Service 1 ──────────── 0..* Appointment
Professional 1 ─────── 0..* BusinessHours
Professional 1 ─────── 0..* AvailabilityBlock
```

---

## 7. Estados del turno

La entidad `Appointment` representa una reserva concreta de un cliente con un profesional para un servicio determinado.

Para el MVP, los estados principales del turno serán:

```text
PENDING
CONFIRMED
CANCELED_BY_CLIENT
CANCELED_BY_ADMIN
REJECTED
COMPLETED
NO_SHOW
```

### Observación importante

Los estados del turno indican qué pasó con una reserva específica. No deben confundirse con la disponibilidad de la agenda.

Por ejemplo:

```text
Un turno cancelado libera el horario.
Un bloqueo de agenda ocupa el horario, pero no es un turno.
```

Por eso, para bloquear horarios donde el profesional no atiende, conviene usar una entidad aparte, por ejemplo `AvailabilityBlock`, `ScheduleBlock` o `TimeBlock`.

---

## 7.1 Descripción de estados

### PENDING

El turno fue solicitado por un cliente, pero todavía no fue confirmado por el administrador.

Este estado aplica principalmente cuando el turno lo crea un usuario con rol `CLIENT`.

```text
CLIENT solicita turno -> Appointment queda PENDING
```

Mientras un turno está `PENDING`, el sistema debe decidir si ese horario queda temporalmente reservado o si sigue disponible para otros clientes.

Para el MVP se recomienda que el turno `PENDING` bloquee temporalmente el horario para evitar que muchas personas pidan el mismo turno al mismo tiempo.

---

### CONFIRMED

El turno está confirmado y reservado.

Puede llegar a este estado de dos maneras:

```text
CLIENT solicita turno -> PENDING -> ADMIN confirma -> CONFIRMED
ADMIN crea turno manualmente -> CONFIRMED
```

Mientras un turno está `CONFIRMED`, el horario no debe aparecer disponible para otros clientes.

---

### CANCELED\_BY\_CLIENT

El cliente canceló el turno.

```text
CONFIRMED -> CANCELED_BY_CLIENT
PENDING -> CANCELED_BY_CLIENT
```

Cuando un turno pasa a este estado, el horario queda liberado nuevamente, siempre que no exista otro turno o bloqueo que lo ocupe.

Este estado es final.

---

### CANCELED\_BY\_ADMIN

El administrador canceló el turno.

Puede suceder, por ejemplo, si el profesional no puede atender, hubo un error de carga o el negocio necesita reorganizar la agenda.

```text
PENDING -> CANCELED_BY_ADMIN
CONFIRMED -> CANCELED_BY_ADMIN
```

Cuando un turno pasa a este estado, el horario queda liberado nuevamente, salvo que el administrador cree un bloqueo de agenda para ese mismo horario.

Este estado es final.

---

### REJECTED

El administrador rechazó una solicitud pendiente.

Este estado aplica principalmente a turnos creados por clientes que quedaron en `PENDING`.

```text
PENDING -> REJECTED
```

A diferencia de `CANCELED_BY_ADMIN`, `REJECTED` representa que el turno solicitado nunca llegó a confirmarse.

Cuando un turno pasa a `REJECTED`, el horario queda liberado.

Este estado es final.

---

### COMPLETED

El turno fue realizado correctamente.

```text
CONFIRMED -> COMPLETED
```

Este estado debería aplicarse una vez que el horario del turno ya pasó y el cliente fue atendido.

Este estado es final.

---

### NO\_SHOW

El cliente no asistió al turno.

```text
CONFIRMED -> NO_SHOW
```

Este estado debería aplicarse después del horario del turno, cuando el administrador confirma que el cliente no se presentó.

Este estado es final.

---

## 7.2 Estados finales

Los estados finales son aquellos desde los cuales el turno ya no debería cambiar a otro estado dentro del flujo normal.

```text
CANCELED_BY_CLIENT
CANCELED_BY_ADMIN
REJECTED
COMPLETED
NO_SHOW
```

Estados no finales:

```text
PENDING
CONFIRMED
```

---

## 8. Máquina de estados del turno

## 8.1 Flujo principal

```text
CLIENT crea turno
        |
        v
     PENDING
        |
        | ADMIN confirma
        v
    CONFIRMED
        |
        | ADMIN marca como realizado
        v
    COMPLETED
```

Flujo cuando el administrador crea el turno:

```text
ADMIN crea turno
        |
        v
    CONFIRMED
        |
        | ADMIN marca como realizado
        v
    COMPLETED
```

---

## 8.2 Cancelación solicitada por el cliente

El cliente puede cancelar un turno pendiente o confirmado.

```text
PENDING ───── cancelar por cliente ─────> CANCELED_BY_CLIENT

CONFIRMED ─── cancelar por cliente ─────> CANCELED_BY_CLIENT
```

### Efecto sobre la disponibilidad

Cuando el turno pasa a `CANCELED_BY_CLIENT`, el horario queda liberado.

```text
Turno CONFIRMED ocupa horario.
Turno CANCELED_BY_CLIENT no ocupa horario.
```

Regla:

```text
Los turnos cancelados no se consideran al calcular disponibilidad.
```

---

## 8.3 Cancelación realizada por el administrador

El administrador puede cancelar un turno pendiente o confirmado.

```text
PENDING ───── cancelar por admin ─────> CANCELED_BY_ADMIN

CONFIRMED ─── cancelar por admin ─────> CANCELED_BY_ADMIN
```

### Casos posibles

#### Caso 1 — Cancelación por error o cambio puntual

El turno se cancela y el horario vuelve a quedar disponible.

```text
CONFIRMED -> CANCELED_BY_ADMIN -> horario liberado
```

#### Caso 2 — Cancelación porque el profesional no estará disponible

El turno se cancela, pero además el administrador crea un bloqueo de agenda para que ese horario no pueda ser tomado por otro cliente.

```text
CONFIRMED -> CANCELED_BY_ADMIN
ADMIN crea AvailabilityBlock
Horario queda bloqueado
```

---

## 8.4 Rechazo de una solicitud pendiente

Si un cliente solicita un turno y el administrador decide no aceptarlo, el turno pasa a `REJECTED`.

```text
PENDING ───── rechazar ─────> REJECTED
```

Este estado sirve para diferenciar una solicitud que nunca fue aceptada de una cancelación de un turno que ya estaba confirmado.

```text
REJECTED = solicitud no aceptada
CANCELED_BY_ADMIN = turno cancelado por decisión administrativa
```

---

## 8.5 Cliente ausente

Si el cliente tenía un turno confirmado pero no asistió, el administrador puede marcarlo como `NO_SHOW`.

```text
CONFIRMED ───── marcar ausente ─────> NO_SHOW
```

Regla recomendada:

```text
Solo se puede marcar NO_SHOW después del horario de inicio del turno.
```

Este estado no libera disponibilidad futura porque el turno ya ocurrió. Sirve como historial.

---

## 8.6 Turno completado

Si el cliente asistió y el servicio fue realizado, el administrador marca el turno como `COMPLETED`.

```text
CONFIRMED ───── completar ─────> COMPLETED
```

Regla recomendada:

```text
Solo se puede completar un turno confirmado.
```

Opcionalmente, también se puede validar que el turno ya haya comenzado o finalizado.

---

## 8.7 Diagrama completo de estados

```text
                         ADMIN confirma
CLIENT crea turno  ───>  PENDING  ───────────────────>  CONFIRMED
                         |   |                            |   |   |
                         |   |                            |   |   |
                         |   | rechazar                   |   |   | completar
                         |   v                            |   |   v
                         | REJECTED                       |   | COMPLETED
                         |                                |   |
                         | cancelar cliente              |   | marcar ausente
                         v                                |   v
                  CANCELED_BY_CLIENT                     | NO_SHOW
                                                          |
                                                          | cancelar cliente
                                                          v
                                                  CANCELED_BY_CLIENT

ADMIN crea turno  ───────────────────────────────────>  CONFIRMED
                                                          |
                                                          | cancelar admin
                                                          v
                                                  CANCELED_BY_ADMIN

PENDING ───── cancelar admin ─────> CANCELED_BY_ADMIN
```

Una versión más compacta:

```text
PENDING -> CONFIRMED
PENDING -> REJECTED
PENDING -> CANCELED_BY_CLIENT
PENDING -> CANCELED_BY_ADMIN

CONFIRMED -> COMPLETED
CONFIRMED -> NO_SHOW
CONFIRMED -> CANCELED_BY_CLIENT
CONFIRMED -> CANCELED_BY_ADMIN
```

Estados finales:

```text
REJECTED
CANCELED_BY_CLIENT
CANCELED_BY_ADMIN
COMPLETED
NO_SHOW
```

---

## 8.8 Transiciones no permitidas

Para mantener la consistencia del sistema, algunas transiciones no deberían permitirse.

Ejemplos:

```text
CANCELED_BY_CLIENT -> CONFIRMED       No permitido
CANCELED_BY_ADMIN -> CONFIRMED        No permitido
REJECTED -> CONFIRMED                 No permitido
COMPLETED -> CANCELED_BY_CLIENT       No permitido
COMPLETED -> NO_SHOW                  No permitido
NO_SHOW -> COMPLETED                  No permitido en el MVP
```

Si más adelante se quisiera corregir errores administrativos, convendría manejarlo con un historial de cambios o una acción especial de administrador, no como parte del flujo normal.

---

## 8.9 Estados que ocupan disponibilidad

No todos los estados ocupan la agenda.

### Ocupan horario

```text
PENDING
CONFIRMED
```

Para el MVP se recomienda que `PENDING` también ocupe horario temporalmente, así se evita que dos clientes pidan exactamente el mismo turno antes de que el administrador revise.

### No ocupan horario

```text
CANCELED_BY_CLIENT
CANCELED_BY_ADMIN
REJECTED
COMPLETED
NO_SHOW
```

Aclaración:

`COMPLETED` y `NO_SHOW` no ocupan disponibilidad futura porque son turnos ya ocurridos. Se conservan por historial.

Para calcular disponibilidad futura, el sistema debería considerar como ocupados los turnos futuros en estado:

```text
PENDING
CONFIRMED
```

---

## 8.10 Bloqueos de agenda del profesional

Los bloqueos de agenda no deberían modelarse como estados del turno, porque pueden existir aunque no haya ningún turno.

Ejemplos:

- El profesional no trabaja un día específico.
- El profesional se toma vacaciones.
- Hay un feriado.
- El profesional tiene una capacitación.
- El negocio cierra por mantenimiento.
- Se bloquea un horario manualmente por decisión del administrador.

Para esto conviene agregar una entidad nueva.

```text
AvailabilityBlock
- id
- professional: Professional
- startDateTime
- endDateTime
- reason
- type
- createdAt
- active
```

Posibles tipos:

```text
MANUAL
VACATION
SICK_LEAVE
HOLIDAY
BUSINESS_CLOSED
OTHER
```

Relación:

```text
Professional 1 ───── 0..* AvailabilityBlock
```

Un bloqueo activo ocupa disponibilidad igual que un turno confirmado.

---

## 8.11 Reglas para bloqueos de agenda

### Crear bloqueo

Cuando el administrador crea un bloqueo, el sistema debe validar si ya existen turnos en ese rango horario.

Ejemplo:

```text
ADMIN bloquea lunes de 10:00 a 14:00 para Profesional A
```

Si no hay turnos en ese rango:

```text
Se crea AvailabilityBlock
Los clientes ya no pueden tomar turnos en ese rango
```

Si ya hay turnos pendientes o confirmados en ese rango, hay dos opciones de negocio.

### Opción A — No permitir crear el bloqueo

```text
No se puede bloquear el horario porque existen turnos activos.
```

Ventaja:

- Evita inconsistencias.

Desventaja:

- El administrador debe cancelar o reprogramar manualmente antes de bloquear.

### Opción B — Permitir crear el bloqueo y cancelar turnos afectados

```text
Se crea AvailabilityBlock
Los turnos afectados pasan a CANCELED_BY_ADMIN
```

Ventaja:

- Resuelve situaciones reales donde el profesional no puede asistir.

Desventaja:

- Requiere manejar notificaciones o avisos a los clientes.

### Recomendación para el MVP

Para el MVP conviene usar la opción A por simplicidad:

```text
No permitir crear un bloqueo si existen turnos PENDING o CONFIRMED en ese rango.
```

Más adelante se puede agregar una opción administrativa avanzada:

```text
Crear bloqueo y cancelar automáticamente turnos afectados.
```

---

## 8.12 Disponibilidad: cuándo un horario está libre

Un horario está disponible si cumple todas estas condiciones:

1. Está dentro del horario laboral del profesional.
2. No se superpone con turnos activos.
3. No se superpone con bloqueos activos.
4. El servicio entra completo dentro del rango disponible.
5. El horario no está en el pasado.

Turnos activos para disponibilidad:

```text
PENDING
CONFIRMED
```

Bloqueos activos para disponibilidad:

```text
AvailabilityBlock.active = true
```

Ejemplo:

```text
Profesional trabaja de 09:00 a 13:00
Servicio dura 60 minutos
Turno CONFIRMED de 10:00 a 11:00
Bloqueo de 12:00 a 13:00
```

Horarios posibles:

```text
09:00 disponible
10:00 no disponible por turno
11:00 disponible
12:00 no disponible por bloqueo
```

---

## 8.13 Campos recomendados para Appointment

Para soportar mejor el flujo de estados, `Appointment` podría tener algunos campos adicionales.

```text
Appointment
- id
- client: User
- professional: Professional
- service: Service
- startDateTime
- endDateTime
- status
- notes
- cancelReason
- rejectionReason
- createdByRole
- confirmedAt
- canceledAt
- completedAt
- noShowAt
- createdAt
- updatedAt
```

### createdByRole

Permite saber si el turno fue creado por un cliente o por el administrador.

```text
CLIENT
ADMIN
```

Regla:

```text
createdByRole = CLIENT -> status inicial PENDING
createdByRole = ADMIN  -> status inicial CONFIRMED
```

---

## 8.14 Forma de toma de turnos y cálculo de disponibilidad

Para el MVP, los horarios disponibles no se guardarán como turnos previamente creados.

Es decir, no existirá un estado como:

```text
AVAILABLE
```

dentro de `Appointment`.

La razón es que un `Appointment` representa una reserva real o una solicitud real de turno. Si todavía no hay cliente, servicio elegido y acción concreta de reserva, todavía no existe un turno.

Por lo tanto, la disponibilidad se calculará dinámicamente cuando el cliente o administrador consulte una fecha.

---

### Concepto principal

```text
Un horario disponible no es un turno.
Un horario disponible es una posibilidad calculada por el sistema.
Un turno existe recién cuando alguien lo solicita o lo carga manualmente.
```

---

### Elementos usados para calcular disponibilidad

Para saber qué horarios están disponibles, el sistema usará:

```text
BusinessHours
Appointments activos
AvailabilityBlocks activos
Service.durationMinutes
```

Donde:

```text
BusinessHours
```

Define cuándo trabaja normalmente el profesional.

```text
Appointment
```

Ocupa horario solo si está en estado `PENDING` o `CONFIRMED`.

```text
AvailabilityBlock
```

Ocupa horario cuando el profesional no está disponible por una excepción, como vacaciones, enfermedad, feriado, cierre del negocio o bloqueo manual.

```text
Service.durationMinutes
```

Define cuánto dura el servicio que el cliente quiere reservar.

---

### Flujo de consulta de disponibilidad

Cuando un cliente quiere solicitar un turno, el flujo será:

```text
Cliente elige servicio
        |
        v
Cliente elige profesional o el sistema muestra profesionales disponibles
        |
        v
Cliente elige fecha
        |
        v
Sistema calcula horarios disponibles
        |
        v
Cliente elige un horario
        |
        v
Sistema crea Appointment en estado PENDING
```

Ejemplo de endpoint:

```http
GET /api/availability?professionalId=1&serviceId=2&date=2026-05-25
```

Respuesta ejemplo:

```json
{
  "date": "2026-05-25",
  "professionalId": 1,
  "serviceId": 2,
  "availableSlots": [
    "09:00",
    "10:30",
    "11:00",
    "15:30"
  ]
}
```

Esos horarios no están guardados como registros en la base de datos. Son calculados al momento de la consulta.

---

### Flujo cuando el cliente toma un turno

Cuando el cliente selecciona un horario disponible, el sistema crea un nuevo `Appointment`.

```text
Horario calculado como disponible
        |
        v
Cliente solicita ese horario
        |
        v
Sistema valida nuevamente la disponibilidad
        |
        v
Sistema crea Appointment
        |
        v
Appointment queda PENDING
```

La validación debe repetirse justo antes de crear el turno para evitar problemas de concurrencia.

Ejemplo:

```text
Dos clientes ven disponible el horario 10:00.
Cliente A confirma primero.
El sistema crea Appointment PENDING para Cliente A.
Cliente B intenta confirmar después.
El sistema vuelve a validar y rechaza la operación porque el horario ya está ocupado.
```

---

### Flujo cuando el administrador carga un turno

Cuando el administrador carga un turno manualmente, el sistema también debe validar la disponibilidad.

```text
ADMIN selecciona cliente
        |
        v
ADMIN selecciona servicio
        |
        v
ADMIN selecciona profesional y horario
        |
        v
Sistema valida disponibilidad
        |
        v
Sistema crea Appointment en estado CONFIRMED
```

Regla:

```text
Turno creado por CLIENT -> PENDING
Turno creado por ADMIN  -> CONFIRMED
```

---

### Cuándo se crea realmente un Appointment

Un `Appointment` se crea solamente cuando ocurre una acción real:

```text
Un cliente solicita un turno.
Un administrador carga un turno manualmente.
```

No se crean `Appointments` para todos los horarios posibles del día.

---

### Estados que afectan disponibilidad

Para calcular disponibilidad futura, se consideran ocupados los turnos en estado:

```text
PENDING
CONFIRMED
```

No se consideran ocupados los turnos en estado:

```text
CANCELED_BY_CLIENT
CANCELED_BY_ADMIN
REJECTED
COMPLETED
NO_SHOW
```

Aclaración:

`COMPLETED` y `NO_SHOW` quedan como historial de turnos ya ocurridos, pero no bloquean disponibilidad futura.

---

### Ventaja de este modelo

Este modelo evita tener que generar y guardar miles de slots disponibles que quizás nunca sean usados.

En lugar de guardar esto:

```text
Slot 09:00 AVAILABLE
Slot 09:30 AVAILABLE
Slot 10:00 AVAILABLE
Slot 10:30 AVAILABLE
```

El sistema guarda solamente reglas y eventos reales:

```text
BusinessHours
Appointments
AvailabilityBlocks
```

Y calcula la disponibilidad cuando se necesita.

---

## 8.15 Transiciones de estado, notificaciones y efectos secundarios

Las transiciones de estado pertenecen al dominio del turno.

Ejemplo:

```text
PENDING -> CONFIRMED
CONFIRMED -> COMPLETED
CONFIRMED -> CANCELED_BY_CLIENT
```

La entidad `Appointment` debe controlar si esas transiciones son válidas.

Sin embargo, los efectos secundarios no deberían vivir dentro de `Appointment`.

Ejemplos de efectos secundarios:

- Enviar email al administrador cuando un cliente solicita un turno.
- Enviar email al cliente cuando el administrador confirma el turno.
- Enviar email al cliente cuando el turno fue cancelado.
- Registrar auditoría o historial de cambios.
- Enviar recordatorios antes del turno.

Estos comportamientos deberían coordinarse desde servicios de aplicación o, en una versión más avanzada, mediante eventos de dominio.

---

### Ejemplo: cliente solicita turno

Cuando un cliente solicita un turno, el flujo recomendado es:

```text
AppointmentService valida disponibilidad
        |
        v
Appointment se crea en PENDING
        |
        v
AppointmentRepository guarda el turno
        |
        v
NotificationService avisa al ADMIN
```

La creación del turno pertenece a `Appointment`.

El envío del aviso pertenece a `NotificationService` o a un listener de eventos.

---

### Ejemplo: administrador confirma turno

Cuando el administrador confirma un turno pendiente:

```text
AppointmentService busca el turno
        |
        v
Appointment.confirm()
        |
        v
AppointmentRepository guarda los cambios
        |
        v
NotificationService avisa al cliente
```

`Appointment.confirm()` valida y aplica la transición:

```text
PENDING -> CONFIRMED
```

Pero no envía emails directamente.

---

### Posible evolución con eventos de dominio

Más adelante se podrían modelar eventos como:

```text
AppointmentRequestedEvent
AppointmentConfirmedEvent
AppointmentCanceledEvent
AppointmentRejectedEvent
AppointmentCompletedEvent
AppointmentNoShowEvent
```

Entonces el flujo sería:

```text
Appointment cambia de estado
        |
        v
Se publica un evento
        |
        v
Un listener reacciona y ejecuta acciones secundarias
```

Ejemplo:

```text
AppointmentRequestedEvent -> enviar email al ADMIN
AppointmentConfirmedEvent -> enviar email al CLIENT
AppointmentCanceledEvent -> enviar email al CLIENT o ADMIN según corresponda
```

Esto permite agregar emails, WhatsApp, SMS, auditoría o historial sin modificar la lógica central de `Appointment`.

---

### Decisión para el MVP

Para la primera versión:

```text
No se usará patrón State.
Appointment usará AppointmentStatus como enum.
Appointment tendrá métodos de transición de estado.
AppointmentService coordinará los casos de uso.
NotificationService manejará emails o avisos.
```

Separación de responsabilidades:

```text
Appointment
- Reglas internas del turno.
- Validación de transiciones.
- Cambio de estado.

AppointmentService
- Orquestación del caso de uso.
- Validación de disponibilidad.
- Persistencia del turno.
- Llamado a notificaciones o publicación de eventos.

NotificationService
- Envío de emails.
- Avisos al administrador.
- Avisos al cliente.
```

---

## 8.16 Historial de turnos en el MVP

Para el MVP se implementará historial de turnos a partir de la entidad `Appointment`.

Esto significa que los turnos no se eliminarán físicamente de la base de datos. En cambio, se conservarán con su estado actual.

De esta manera, el sistema podrá consultar el historial de un cliente o de un profesional sin crear una entidad adicional de auditoría.

---

### Historial de turnos de un cliente

El historial de un cliente se obtiene consultando sus `Appointments`.

Ejemplo:

```text
Cliente: Juan Pérez

Turnos:
- 2026-05-20 10:00 | Corte de pelo | COMPLETED
- 2026-05-25 11:00 | Barba         | CANCELED_BY_CLIENT
- 2026-06-01 09:00 | Corte         | NO_SHOW
- 2026-06-10 15:00 | Corte         | PENDING
```

Esto permite saber, por ejemplo:

- Cuántos turnos completó el cliente.
- Cuántos turnos canceló.
- Si tuvo ausencias en turnos confirmados.
- Cuándo fue su último turno.
- Cuál es su próximo turno.
- Qué servicios suele solicitar.

---

### Historial de turnos de un profesional

El historial de un profesional también se obtiene consultando sus `Appointments`.

Ejemplo:

```text
Profesional: María Gómez

Turnos:
- 2026-05-20 10:00 | Juan Pérez  | COMPLETED
- 2026-05-20 11:00 | Ana Díaz    | NO_SHOW
- 2026-05-20 12:00 | Carlos Ruiz | CANCELED_BY_ADMIN
```

Esto permite saber, por ejemplo:

- Cuántos turnos atendió el profesional.
- Cuántos turnos tiene pendientes o confirmados.
- Cuántos turnos fueron cancelados.
- Cuántos clientes no asistieron.
- Cómo fue la carga de trabajo en un período.

---

### Diferencia con auditoría de cambios

El historial de turnos no es lo mismo que una auditoría detallada.

```text
Historial de turnos
= lista de turnos pasados, presentes y futuros asociados a un cliente o profesional.
```

```text
Auditoría de cambios
= registro detallado de cada modificación que sufrió un turno.
```

Para el MVP alcanza con conservar los `Appointments` y consultar por cliente, profesional, fecha y estado.

La auditoría detallada, con una entidad como `AppointmentHistory`, quedará como posible mejora futura.

---

### Consultas útiles para historial

Endpoints posibles:

```http
GET /api/appointments?clientId=3
GET /api/appointments?professionalId=2
GET /api/appointments?clientId=3&status=NO_SHOW
GET /api/appointments?clientId=3&status=CANCELED_BY_CLIENT
GET /api/appointments?professionalId=2&from=2026-05-01&to=2026-05-31
```

También se podría agregar un endpoint específico para una vista resumida:

```http
GET /api/clients/{id}/appointment-history
GET /api/professionals/{id}/appointment-history
```

Para el MVP, estos endpoints específicos pueden ser opcionales si los filtros de `/api/appointments` son suficientemente completos.

---

### Regla principal

```text
Los turnos no se borran físicamente.
Los turnos se conservan con su estado.
El historial se obtiene consultando Appointments.
```

Esto permite analizar comportamiento del cliente y carga de trabajo del profesional sin agregar complejidad innecesaria al primer diseño.

---

## 8.17 Endpoints relacionados con estados

```http
PATCH /api/appointments/{id}/confirm
PATCH /api/appointments/{id}/reject
PATCH /api/appointments/{id}/cancel-by-client
PATCH /api/appointments/{id}/cancel-by-admin
PATCH /api/appointments/{id}/complete
PATCH /api/appointments/{id}/no-show
```

Estos endpoints coinciden con los métodos de transición definidos en `Appointment` y con los estados finales del dominio.

Para bloqueos de agenda:

```http
POST /api/availability-blocks
GET /api/availability-blocks
GET /api/availability-blocks/{id}
DELETE /api/availability-blocks/{id}
```

El `DELETE` de un bloqueo puede implementarse como baja lógica:

```text
active = false
```

---

## 9. Reglas de negocio iniciales

Las reglas principales del sistema son:

1. No permitir crear turnos en el pasado.
2. No permitir dos turnos superpuestos para el mismo profesional.
3. Validar que el turno esté dentro del horario laboral del profesional.
4. Calcular automáticamente la hora de finalización del turno según la duración del servicio.
5. Permitir cancelar turnos sin eliminarlos físicamente.
6. Permitir consultar turnos por fecha, profesional, cliente y estado.
7. Permitir consultar disponibilidad por día, profesional y servicio.
8. Permitir consultar historial de turnos por cliente y por profesional.
9. No eliminar físicamente turnos; conservarlos con su estado para mantener historial.

---

## 10. Endpoints iniciales propuestos

## 10.1 Auth

```http
POST /auth/register
POST /auth/login
```

---

## 10.2 Services

```http
POST /api/services
GET /api/services
GET /api/services/{id}
PUT /api/services/{id}
DELETE /api/services/{id}
```

Observación: el `DELETE` puede implementarse como baja lógica usando `active = false`.

---

## 10.3 Professionals

```http
POST /api/professionals
GET /api/professionals
GET /api/professionals/{id}
PUT /api/professionals/{id}
```

---

## 10.4 Appointments

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

Observación: para el MVP se separan los endpoints de cancelación por cliente y por administrador porque el dominio diferencia los estados `CANCELED_BY_CLIENT` y `CANCELED_BY_ADMIN`.

Filtros posibles:

```http
GET /api/appointments?from=2026-05-01&to=2026-05-31&status=CONFIRMED
GET /api/appointments?professionalId=1&date=2026-05-25
GET /api/appointments?clientId=3
GET /api/appointments?clientId=3&status=NO_SHOW
GET /api/appointments?professionalId=2&from=2026-05-01&to=2026-05-31
```

---

## 10.5 Availability

```http
GET /api/availability?professionalId=1&serviceId=2&date=2026-05-25
```

Este endpoint no consulta turnos en estado `AVAILABLE`; calcula dinámicamente la disponibilidad usando horarios laborales, turnos activos, bloqueos activos y duración del servicio.

Respuesta esperada:

```json
{
  "date": "2026-05-25",
  "availableSlots": [
    "09:00",
    "09:30",
    "10:00",
    "11:30"
  ]
}
```

---

## 11. Stack técnico propuesto

```text
Java 17 o 21
Spring Boot
Spring Security + JWT
Spring Data JPA
PostgreSQL
Flyway o Liquibase
Swagger / OpenAPI
JUnit + Mockito
Docker opcional
```

Para desarrollo se podría usar H2, aunque para este proyecto conviene considerar PostgreSQL desde el principio para hacerlo más realista.

---

## 12. Planning técnico del proyecto

Esta sección transforma el diseño funcional del backend en un plan de implementación ordenado.

La idea es que el backend pueda desarrollarse primero como una API genérica de gestión de turnos para un único negocio, y que luego el frontend pueda adaptarse visual y funcionalmente al tipo de negocio concreto.

---

## 12.1 Estrategia de repositorios

Para el MVP se recomienda trabajar con backend y frontend separados.

```text
gestion-turnos-api      -> Backend Spring Boot
gestion-turnos-web      -> Frontend React/Vite
```

### Motivo

El backend debería ser relativamente genérico y reutilizable para distintos rubros:

```text
Estética
Barbería
Consultorio
Kinesiología
Taller
Clases particulares
```

El frontend, en cambio, puede adaptarse más fácilmente al negocio específico mediante textos, colores, pantallas, branding y flujos visuales.

Separar ambos proyectos permite que la API funcione como producto independiente y que, en el futuro, puedan existir diferentes frontends usando el mismo backend.

Ejemplo:

```text
Backend genérico:
/api/services
/api/professionals
/api/appointments
/api/availability

Frontend para estética:
Diseño visual orientado a estética, belleza y turnos personales.

Frontend para consultorio:
Diseño visual más sobrio, orientado a pacientes y profesionales de salud.
```

---

## 12.2 Alternativa futura: repositorio contenedor o monorepo

Aunque el backend y frontend pueden nacer como repositorios separados, más adelante se puede crear un repositorio contenedor para mostrar el proyecto completo.

Ejemplo:

```text
gestion-turnos-platform
├── backend
└── frontend
```

Este repositorio puede servir como presentación integral del sistema, especialmente para portfolio.

Sin embargo, para desarrollo inicial se recomienda mantenerlos separados para reducir acoplamiento y mantener clara la responsabilidad de cada parte.

---

## 12.3 Orden recomendado de implementación del backend

## Fase 0 — Preparación del proyecto

Objetivo: dejar lista la base técnica del backend.

Tareas:

- Crear proyecto Spring Boot.
- Configurar Java 17 o 21.
- Configurar PostgreSQL.
- Configurar perfiles `dev` y `test`.
- Configurar estructura de paquetes.
- Agregar dependencias principales:
  - Spring Web.
  - Spring Data JPA.
  - Spring Security.
  - Validation.
  - PostgreSQL Driver.
  - Lombok opcional.
  - SpringDoc OpenAPI.
  - JUnit/Mockito.
- Crear README inicial.

Estructura sugerida:

```text
src/main/java/com/turnos/api
├── auth
├── users
├── services
├── professionals
├── appointments
├── availability
├── common
└── config
```

---

## Fase 1 — Modelo de dominio base

Objetivo: implementar las entidades principales sin lógica avanzada todavía.

Tareas:

- Crear `User`.
- Crear `Service`.
- Crear `Professional`.
- Crear `Appointment`.
- Crear `BusinessHours`.
- Crear `AvailabilityBlock`.
- Crear enums:
  - `UserRole`.
  - `AppointmentStatus`.
  - `CreatedByRole`.
  - `AvailabilityBlockType`.
- Crear repositorios JPA.
- Crear migraciones con Flyway o esquema inicial.

Criterio de finalización:

- La aplicación levanta correctamente.
- Las tablas se crean correctamente.
- Las relaciones principales están mapeadas.

---

## Fase 2 — Autenticación y usuarios

Objetivo: permitir registro, login y control de roles.

Tareas:

- Implementar registro de clientes.
- Implementar login.
- Implementar JWT.
- Implementar roles `ADMIN` y `CLIENT`.
- Proteger rutas `/api/**`.
- Permitir `/auth/**` públicamente.
- Crear usuario administrador inicial mediante seed o configuración.

Endpoints:

```http
POST /auth/register
POST /auth/login
```

Criterio de finalización:

- Un cliente puede registrarse.
- Un usuario puede iniciar sesión.
- El backend devuelve un JWT válido.
- Las rutas protegidas requieren autenticación.

---

## Fase 3 — CRUD de catálogos administrativos

Objetivo: permitir que el administrador configure la base del negocio.

Tareas:

- CRUD de servicios.
- CRUD de profesionales.
- CRUD de horarios laborales.
- CRUD de bloqueos de agenda.
- Implementar bajas lógicas usando `active = false`.
- Validar que servicios y profesionales inactivos no puedan usarse para nuevos turnos.

Endpoints principales:

```http
/api/services
/api/professionals
/api/business-hours
/api/availability-blocks
```

Criterio de finalización:

- El administrador puede cargar servicios.
- El administrador puede cargar profesionales.
- El administrador puede definir horarios laborales.
- El administrador puede bloquear rangos de agenda sin turnos activos superpuestos.

---

## Fase 4 — Gestión de turnos

Objetivo: implementar la creación y administración de turnos.

Tareas:

- Crear turno solicitado por cliente en estado `PENDING`.
- Crear turno cargado por administrador en estado `CONFIRMED`.
- Confirmar turno pendiente.
- Rechazar turno pendiente.
- Cancelar turno por cliente.
- Cancelar turno por administrador.
- Completar turno.
- Marcar turno como `NO_SHOW`.
- Validar reglas de transición de estado.
- Conservar turnos para historial.

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

Criterio de finalización:

- Los clientes pueden solicitar turnos.
- Los administradores pueden cargar turnos manualmente.
- El estado inicial depende de quién crea el turno.
- Las transiciones inválidas son rechazadas.
- Los turnos no se eliminan físicamente.

---

## Fase 5 — Disponibilidad

Objetivo: calcular dinámicamente horarios disponibles sin persistir turnos `AVAILABLE`.

Tareas:

- Implementar `AvailabilityService`.
- Consultar horarios laborales del profesional.
- Restar turnos activos `PENDING` y `CONFIRMED`.
- Restar bloqueos activos.
- Validar que el servicio entre completo dentro del horario laboral.
- Validar que el horario no esté en el pasado.
- Revalidar disponibilidad antes de crear cada turno.

Endpoint principal:

```http
GET /api/availability?professionalId=1&serviceId=2&date=2026-05-25
```

Criterio de finalización:

- El sistema devuelve slots disponibles calculados dinámicamente.
- Los turnos pendientes y confirmados ocupan disponibilidad.
- Los bloqueos activos ocupan disponibilidad.
- El sistema evita superposiciones.

---

## Fase 6 — Historial y consultas

Objetivo: permitir consultar turnos pasados, presentes y futuros por cliente o profesional.

Tareas:

- Filtrar turnos por cliente.
- Filtrar turnos por profesional.
- Filtrar turnos por estado.
- Filtrar turnos por rango de fechas.
- Preparar respuestas útiles para vistas de historial.

Consultas principales:

```http
GET /api/appointments?clientId=3
GET /api/appointments?professionalId=2
GET /api/appointments?clientId=3&status=NO_SHOW
GET /api/appointments?professionalId=2&from=2026-05-01&to=2026-05-31
```

Criterio de finalización:

- Se puede consultar el historial de un cliente.
- Se puede consultar el historial de un profesional.
- Se puede analizar cancelaciones, ausencias y turnos completados.

---

## Fase 7 — Notificaciones básicas

Objetivo: separar efectos secundarios de la lógica de dominio.

Para el MVP, esta fase puede ser opcional o quedar preparada para una versión posterior.

Tareas posibles:

- Crear `NotificationService`.
- Enviar aviso al administrador cuando un cliente solicita un turno.
- Enviar aviso al cliente cuando el administrador confirma el turno.
- Enviar aviso al cliente cuando el turno es cancelado.

Regla de arquitectura:

```text
Appointment no envía emails.
AppointmentService coordina el caso de uso.
NotificationService maneja los avisos.
```

---

## Fase 8 — Calidad, documentación y portfolio

Objetivo: dejar el proyecto presentable y mantenible.

Tareas:

- Agregar Swagger/OpenAPI.
- Agregar manejo global de errores.
- Agregar validaciones con Bean Validation.
- Agregar tests unitarios de reglas críticas.
- Agregar tests de integración básicos.
- Agregar datos seed/demo.
- Preparar README con:
  - Descripción del sistema.
  - Diagrama de clases.
  - Reglas de negocio.
  - Endpoints principales.
  - Cómo correr el proyecto.
  - Capturas o ejemplos de respuestas.

Tests críticos recomendados:

- No permitir turnos en el pasado.
- No permitir turnos superpuestos.
- No permitir crear turnos fuera del horario laboral.
- No permitir turnos sobre bloqueos activos.
- `CLIENT` crea turno en `PENDING`.
- `ADMIN` crea turno en `CONFIRMED`.
- No permitir transiciones inválidas.

---

## 12.4 Sugerencia de trabajo con Codex

Para usar Codex de manera ordenada, conviene pedirle tareas pequeñas y verificables, no “hacer todo el backend” de una sola vez.

Ejemplos de prompts útiles:

```text
Implementá las entidades JPA y enums definidos en el documento, sin crear controllers todavía.
```

```text
Implementá el CRUD de servicios con DTOs, validaciones y baja lógica.
```

```text
Implementá la lógica de transición de estados de Appointment y agregá tests unitarios.
```

```text
Implementá AvailabilityService para calcular horarios disponibles a partir de BusinessHours, Appointments activos y AvailabilityBlocks activos.
```

```text
Revisá el código buscando inconsistencias con el documento de diseño.
```

Codex puede trabajar sobre repositorios conectados a GitHub y crear cambios en ramas o pull requests según el flujo que se use. También puede revisar código y ayudar a escribir o modificar features sobre un repo existente.

---

## 13. Decisiones tomadas y pendientes

## 13.1 Tipo de sistema: único negocio o multi-negocio

Una decisión importante es si el sistema estará pensado para un único negocio o para múltiples negocios.

### Opción A — Único negocio

El sistema pertenece a un solo negocio.

Ejemplo:

```text
Sistema de turnos para una estética específica.
```

En este caso no hace falta una entidad `Business`, `Company` o `Organization`, porque todos los servicios, profesionales y turnos pertenecen implícitamente al mismo negocio.

Es más simple para iniciar el MVP.

### Opción B — Multi-negocio

El sistema funciona como una plataforma donde muchos negocios pueden registrarse y gestionar sus propios turnos.

Ejemplo:

```text
Una plataforma donde se registran varias estéticas, barberías o consultorios.
```

En ese caso habría que agregar una entidad como:

```text
Business
- id
- name
- address
- phone
- email
- active
```

Y muchas entidades deberían pertenecer a un negocio:

```text
Business 1 ─── 0..* Service
Business 1 ─── 0..* Professional
Business 1 ─── 0..* Appointment
Business 1 ─── 0..* BusinessHours
Business 1 ─── 0..* AvailabilityBlock
```

### Decisión tomada

El sistema será inicialmente para **un único negocio**.

Esto significa que el MVP no tendrá una entidad `Business`, `Company` u `Organization`. Todos los servicios, profesionales, horarios y turnos pertenecerán implícitamente al mismo negocio.

Esta decisión reduce complejidad y permite enfocarse mejor en las reglas principales del sistema: turnos, disponibilidad, horarios laborales, clientes, servicios y estados.

Más adelante podría evolucionar a multi-negocio si se quisiera convertir en una plataforma más grande.

---

## 13.2 Professional inicialmente no será un User

Decisión tomada:

```text
Professional no será inicialmente un usuario del sistema.
```

Esto significa que el profesional no tendrá login propio al comienzo.

El sistema tendrá un usuario administrador, por ejemplo un `ADMIN`, que se encargará de:

- Cargar profesionales.
- Cargar servicios.
- Gestionar horarios laborales.
- Ver turnos tomados.
- Informar los turnos al profesional correspondiente.

En este escenario, la secretaria o administrador es quien usa el sistema y luego le comunica al profesional los turnos que tiene asignados dentro de su horario de trabajo.

Más adelante, si se quiere, se puede agregar el rol `PROFESSIONAL` para que cada profesional pueda iniciar sesión y consultar su propia agenda.

---

## 13.3 Estado inicial del turno: PENDING o CONFIRMED

Se analizó si un turno debía nacer como `PENDING` o directamente como `CONFIRMED`. Para el MVP se decidió usar una regla mixta según quién crea el turno.

### Opción A — El turno nace como PENDING

Cuando el cliente solicita un turno, el turno queda pendiente hasta que el administrador lo confirma.

```text
PENDING ─── confirmar ───> CONFIRMED
```

#### Ventajas

- El negocio tiene control antes de confirmar definitivamente el turno.
- Sirve si los horarios no están 100% automatizados.
- Permite revisar manualmente casos especiales.
- Es útil si el profesional o la secretaria deben aprobar la reserva.
- Reduce el riesgo de que el cliente crea que el turno está confirmado cuando todavía falta validación humana.

#### Desventajas

- Requiere intervención manual del administrador.
- El cliente no obtiene confirmación inmediata.
- Puede generar más trabajo operativo.
- Hay que comunicar bien al cliente que el turno está “pendiente de confirmación”.

### Opción B — El turno nace como CONFIRMED

Cuando el cliente reserva un horario disponible, el turno queda confirmado automáticamente.

```text
CONFIRMED
```

#### Ventajas

- La experiencia del cliente es más rápida y clara.
- No requiere que el administrador confirme cada turno.
- Funciona muy bien si el sistema de disponibilidad está bien validado.
- Automatiza más el proceso.

#### Desventajas

- Exige que las reglas de disponibilidad sean confiables.
- Si el negocio todavía trabaja con mucha coordinación manual, puede ser riesgoso.
- Puede generar problemas si el profesional no revisa el sistema frecuentemente.
- Requiere que horarios, duración de servicios y turnos bloqueados estén bien cargados.

### Decisión tomada

Para la primera versión se usará una regla mixta según quién crea el turno:

```text
Turno creado por CLIENT  -> PENDING
Turno creado por ADMIN   -> CONFIRMED
```

Esto permite diferenciar dos situaciones reales del negocio.

Cuando un cliente solicita un turno desde el sistema, el turno queda inicialmente como `PENDING`. Luego el administrador o secretaria puede revisarlo y confirmarlo.

```text
Cliente solicita turno -> PENDING -> ADMIN confirma -> CONFIRMED
```

Cuando el administrador carga un turno manualmente, por ejemplo porque el cliente pidió el turno por WhatsApp, teléfono o presencialmente, el turno nace directamente como `CONFIRMED`.

```text
Cliente contacta al negocio -> ADMIN carga el turno -> CONFIRMED
```

Esta opción combina control manual con practicidad administrativa y encaja bien con el funcionamiento inicial del sistema.

---

## 13.4 Registro y carga de clientes

Decisión tomada:

```text
Los clientes podrán registrarse por sí mismos o ser cargados por el ADMIN.
```

Esto permite dos flujos:

### Flujo 1 — Registro por cliente

El cliente entra al sistema, crea su cuenta y solicita un turno.

```text
Cliente se registra -> inicia sesión -> solicita turno
```

### Flujo 2 — Carga por administrador

El cliente se comunica por otro medio, por ejemplo WhatsApp, teléfono o presencialmente, y el administrador lo carga en el sistema.

```text
Cliente contacta al negocio -> ADMIN carga cliente -> ADMIN carga turno
```

Esto hace que el sistema sea más flexible y se adapte mejor a negocios reales, donde no todos los clientes van a usar la plataforma directamente.

---

## 13.5 Duración del slot base

Decisión tomada:

```text
La duración del slot dependerá del servicio.
```

No todos los servicios tienen la misma duración ni necesitan la misma granularidad.

Por ejemplo:

```text
Corte de pelo        -> 30 minutos
Manicura             -> 45 minutos
Consulta inicial     -> 60 minutos
Control rápido       -> 15 minutos
```

Por eso, la duración debe ser un atributo de la entidad `Service`.

```text
Service
- id
- name
- description
- durationMinutes
- price
- active
```

El sistema usará `durationMinutes` para calcular automáticamente la finalización del turno:

```text
endDateTime = startDateTime + service.durationMinutes
```

### Observación

Más adelante se podría agregar también un campo de intervalo o granularidad si se necesita diferenciar entre duración del servicio y frecuencia de los turnos ofrecidos.

Ejemplo:

```text
Service
- durationMinutes
- slotIntervalMinutes
```

Esto permitiría casos como:

```text
Servicio dura 60 minutos, pero se ofrecen inicios cada 30 minutos.
```

Para el MVP, alcanza con `durationMinutes`.

---

## 13.6 Recordatorios por email

Decisión tomada:

```text
En una etapa avanzada, el sistema debería enviar un recordatorio por email un día antes del turno solicitado.
```

Ejemplo:

```text
Turno: 2026-05-25 10:00
Recordatorio: 2026-05-24
```

Esto podría implementarse más adelante con una tarea programada que revise los turnos próximos y envíe emails a los clientes.

Posible regla:

```text
Enviar recordatorio por email 24 horas antes del turno si el turno está CONFIRMED.
```

Para evitar duplicados, la entidad `Appointment` podría tener un campo adicional en una etapa futura:

```text
reminderSentAt
```

De esa forma, el sistema sabe si el recordatorio ya fue enviado.

---

## 14. Decisiones tomadas para el MVP

Para la primera versión del backend quedan definidas las siguientes decisiones:

- El sistema será para un único negocio.
- `Professional` no será inicialmente un `User`.
- El administrador o secretaria será quien cargue profesionales, servicios, horarios y turnos manuales.
- Los clientes podrán registrarse por sí mismos o ser cargados por el `ADMIN`.
- Los turnos creados por `CLIENT` nacerán como `PENDING`.
- Los turnos creados por `ADMIN` nacerán como `CONFIRMED`.
- La duración del turno dependerá del servicio mediante el atributo `durationMinutes`.
- En una etapa avanzada se agregará recordatorio por email un día antes del turno confirmado.
- No se crearán turnos en estado `AVAILABLE`; la disponibilidad se calculará dinámicamente a partir de horarios laborales, turnos activos, bloqueos y duración del servicio.
- No se implementará el patrón State en el MVP; se usará `AppointmentStatus` como enum y métodos de transición dentro de `Appointment`.
- Las notificaciones y efectos secundarios no estarán dentro de `Appointment`; se manejarán desde servicios de aplicación como `AppointmentService` y `NotificationService`, o mediante eventos de dominio en una etapa posterior.
- El historial de turnos forma parte del MVP y se obtendrá consultando `Appointments` conservados por cliente, profesional, fecha y estado.

---

## 15. Decisiones futuras posibles

Estas decisiones no son necesarias para el MVP, pero pueden considerarse en versiones posteriores:

- Convertir el sistema en multi-negocio.
- Permitir que cada profesional tenga login propio mediante un rol `PROFESSIONAL`.
- Permitir reprogramar turnos.
- Crear una opción administrativa avanzada para generar bloqueos de agenda y cancelar automáticamente los turnos afectados.
- Manejar feriados, vacaciones o días no laborables de forma más automatizada.
- Agregar notificaciones por WhatsApp o SMS.
- Agregar auditoría detallada de cambios de cada turno mediante una entidad como `AppointmentHistory`.
- Refactorizar la lógica de estados usando patrón State si las transiciones crecen mucho o si cada estado empieza a requerir comportamientos propios complejos.
- Implementar eventos de dominio para desacoplar notificaciones, auditoría y otros efectos secundarios de las reglas centrales del turno.

