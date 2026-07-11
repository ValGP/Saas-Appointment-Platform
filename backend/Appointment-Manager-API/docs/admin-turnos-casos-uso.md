# Casos de uso admin - Definicion y gestion normal de turnos

Este documento describe flujos normales para grabar videos de uso del panel administrativo de BIBE Estetica. El foco esta en mostrar como el admin configura la agenda, define disponibilidad, crea turnos y opera el ciclo normal de estados segun las reglas del backend.

## 1. Contexto del sistema

El MVP funciona para un unico negocio. El panel admin es usado por la administradora, secretaria o responsable del centro para:

- Cargar servicios.
- Cargar profesionales.
- Definir que servicios atiende cada profesional.
- Definir horarios laborales.
- Registrar bloqueos de agenda.
- Revisar disponibilidad semanal.
- Crear turnos manuales para clientes.
- Confirmar, cancelar, completar o marcar turnos como no asistio.
- Consultar historial operativo con filtros.

Reglas base que deben quedar claras en los videos:

- Un turno creado por `CLIENT` nace en estado `PENDING`.
- Un turno creado por `ADMIN` nace en estado `CONFIRMED`.
- Los turnos `PENDING` y `CONFIRMED` ocupan disponibilidad.
- Los turnos cancelados, rechazados, completados o no-show ya no ocupan disponibilidad.
- La disponibilidad no se guarda como turnos libres; se calcula dinamicamente.
- La disponibilidad depende de servicio, profesional, horarios laborales, bloqueos y turnos activos.
- Un profesional puede atender todos los servicios o solo servicios seleccionados.
- Servicios, profesionales, horarios y bloqueos inactivos no se usan para nuevas reservas.

## 2. Preparacion recomendada para videos

Antes de grabar, conviene tener un ambiente demo con:

- Usuario admin: `admin@turnos.local`.
- Al menos dos servicios activos:
  - Limpieza facial, 60 minutos.
  - Perfilado de cejas, 30 minutos.
- Al menos dos profesionales activos:
  - Ana Gomez.
  - Valeria Ruiz.
- Horarios laborales activos:
  - Ana Gomez: lunes a viernes, 09:00 a 17:00.
  - Valeria Ruiz: lunes, miercoles y viernes, 10:00 a 16:00.
- Al menos un cliente existente:
  - Sofia Perez.
- Una semana futura sin demasiados turnos cargados para que se vean slots disponibles.

## 3. Flujo 1 - Configurar un servicio reservable

Objetivo del video: mostrar que el admin define el catalogo de servicios que despues aparece en agenda y disponibilidad.

Precondiciones:

- El admin inicio sesion.
- El panel admin esta abierto.

Pasos:

1. Entrar a `Servicios`.
2. Seleccionar `Nuevo servicio`.
3. Completar nombre, descripcion, duracion y precio.
4. Guardar el servicio.
5. Verificar que el servicio aparece activo en el listado.

Resultado esperado:

- El servicio queda disponible para ser usado en turnos.
- La duracion ingresada se usara para calcular `endDateTime` del turno.
- Si el servicio esta activo, puede aparecer en la pantalla `Agenda`.

Puntos para narrar:

- La duracion del servicio define cuanto ocupa el turno.
- No hace falta crear horarios libres manualmente.
- Si mas adelante se desactiva el servicio, no se borra el historial, pero deja de poder usarse para nuevos turnos.

## 4. Flujo 2 - Crear un profesional y dejarlo habilitado para todos los servicios

Objetivo del video: mostrar la configuracion simple para negocios donde todos atienden todos los servicios.

Precondiciones:

- Existe al menos un servicio activo.

Pasos:

1. Entrar a `Profesionales`.
2. Seleccionar `Nuevo profesional`.
3. Completar nombre, email y telefono.
4. En la seccion de servicios, dejar seleccionado `Todos`.
5. Guardar el profesional.
6. Verificar que aparece como activo en el listado.

Resultado esperado:

- El profesional queda en modo `ALL_SERVICES`.
- Puede atender cualquier servicio activo.
- Todavia no generara disponibilidad hasta que se le carguen horarios laborales.

Puntos para narrar:

- Este es el caso mas simple: no hay que asignar servicios uno por uno.
- El aviso `Sin horarios`, si aparece, indica que el profesional existe pero todavia no tiene agenda laboral cargada.

## 5. Flujo 3 - Crear un profesional que solo atiende servicios seleccionados

Objetivo del video: mostrar la relacion profesional-servicio para filtrar agenda y evitar reservas incorrectas.

Precondiciones:

- Existen varios servicios activos.

Pasos:

1. Entrar a `Profesionales`.
2. Seleccionar `Nuevo profesional` o editar uno existente.
3. En la seccion de servicios, cambiar de `Todos` a `Seleccionar`.
4. Marcar solo los servicios que ese profesional atiende.
5. Guardar.
6. Ir a `Agenda`.
7. Seleccionar un servicio no asignado y verificar que ese profesional no aparece como compatible.
8. Seleccionar un servicio asignado y verificar que si aparece.

Resultado esperado:

- El profesional queda en modo `SELECTED_SERVICES`.
- La agenda solo lo ofrece para los servicios seleccionados.
- Si se intenta crear un turno con una combinacion incompatible, el backend debe rechazarlo.

Puntos para narrar:

- El frontend ayuda filtrando opciones, pero la validacion final vive en backend.
- Cambiar asignaciones no borra turnos historicos.
- La compatibilidad afecta nuevas disponibilidades y nuevas reservas.

## 6. Flujo 4 - Definir horarios laborales de un profesional

Objetivo del video: mostrar que la disponibilidad nace de los horarios laborales activos.

Precondiciones:

- Existe un profesional activo.

Pasos:

1. Entrar a `Horarios`.
2. Seleccionar el profesional.
3. Seleccionar `Nuevo horario`.
4. Elegir dia de semana.
5. Cargar hora de inicio y fin.
6. Guardar.
7. Repetir para los dias que corresponda.
8. Ir a `Agenda`, elegir servicio y profesional, y revisar la semana.

Resultado esperado:

- La agenda muestra slots disponibles dentro de esos rangos.
- No se ofrecen horarios fuera del rango laboral.
- Si un servicio dura 60 minutos, solo aparecen slots donde entra completo.

Puntos para narrar:

- El horario laboral es semanal, por profesional.
- No se permiten rangos invalidos donde inicio sea mayor o igual al fin.
- No se deben crear horarios activos superpuestos para el mismo profesional y dia.
- Desactivar un horario deja de generar disponibilidad sin borrar turnos existentes.

## 7. Flujo 5 - Revisar disponibilidad semanal en Agenda

Objetivo del video: mostrar la pantalla central para ver slots libres y turnos ocupados.

Precondiciones:

- Existe al menos un servicio activo.
- Existe al menos un profesional activo compatible con ese servicio.
- El profesional tiene horarios laborales activos.

Pasos:

1. Entrar a `Agenda`.
2. Seleccionar un servicio.
3. Seleccionar un profesional compatible.
4. Usar los controles de semana anterior/proxima semana si hace falta.
5. Observar los slots marcados como disponibles.
6. Observar los turnos ocupados si existen.

Resultado esperado:

- La pantalla muestra horarios disponibles por dia y hora.
- Los turnos `PENDING` y `CONFIRMED` aparecen como ocupados.
- Los horarios bloqueados o fuera de jornada no aparecen como disponibles.

Puntos para narrar:

- La agenda se calcula en vivo usando servicio, profesional, horarios, bloqueos y turnos activos.
- Si no aparecen horarios, hay que revisar horarios laborales, bloqueos, profesional-servicio o estado activo de catalogos.
- La duracion del servicio afecta la cantidad de slots ofrecidos.

## 8. Flujo 6 - Crear un turno manual para un cliente existente

Objetivo del video: mostrar el flujo normal de carga por telefono, WhatsApp o recepcion.

Precondiciones:

- Existe un cliente activo.
- Existe un slot disponible en `Agenda`.

Pasos:

1. Entrar a `Agenda`.
2. Seleccionar servicio y profesional.
3. Hacer click en un slot `Disponible`.
4. En el modal `Crear turno`, dejar `Cliente existente`.
5. Seleccionar el cliente.
6. Agregar notas opcionales.
7. Confirmar `Crear turno`.
8. Verificar que el slot queda ocupado.
9. Entrar a `Turnos` y confirmar que aparece como `Confirmado`.

Resultado esperado:

- El turno queda creado por admin.
- El estado inicial es `CONFIRMED`.
- El horario deja de aparecer como disponible.
- El turno queda listado en agenda e historial.

Puntos para narrar:

- Cuando el admin carga el turno, se entiende que ya fue confirmado con el cliente.
- El sistema calcula automaticamente la hora de fin segun la duracion del servicio.
- Antes de guardar, backend revalida disponibilidad para evitar doble reserva.

## 9. Flujo 7 - Crear cliente nuevo y turno en la misma operacion

Objetivo del video: mostrar el flujo rapido cuando el cliente no existe todavia.

Precondiciones:

- Existe un slot disponible en agenda.

Pasos:

1. Entrar a `Agenda`.
2. Seleccionar servicio y profesional.
3. Elegir un slot disponible.
4. En el modal `Crear turno`, cambiar a `Nuevo cliente`.
5. Completar nombre, telefono, email y password.
6. Agregar notas opcionales.
7. Confirmar `Crear turno`.
8. Verificar que se crea el cliente y el turno.

Resultado esperado:

- Se crea un usuario cliente activo.
- Se crea el turno asociado a ese cliente.
- Como lo crea el admin, el turno queda `CONFIRMED`.
- El cliente queda disponible para futuras reservas.

Puntos para narrar:

- Este flujo sirve para clientes que llegan por canales externos.
- El cliente cargado por admin tambien queda registrado en el sistema.
- Si el email ya existe, el sistema debe informar el error y no duplicar clientes.

## 10. Flujo 8 - Cliente solicita turno y admin lo confirma

Objetivo del video: mostrar la diferencia entre solicitud del cliente y confirmacion administrativa.

Precondiciones:

- Existe un turno creado por un cliente en estado `PENDING`.

Pasos:

1. Entrar a `Turnos`.
2. Usar el tab o filtro `Pendientes`.
3. Abrir `Ver detalle` del turno.
4. Revisar cliente, profesional, servicio, fecha, horario y notas.
5. Seleccionar `Confirmar turno`.
6. Aceptar la confirmacion.
7. Verificar que el estado cambia a `Confirmado`.

Resultado esperado:

- El turno pasa de `PENDING` a `CONFIRMED`.
- Se registra `confirmedAt`.
- El turno sigue ocupando disponibilidad.

Puntos para narrar:

- Los turnos solicitados por clientes no quedan confirmados automaticamente.
- El estado `PENDING` tambien bloquea temporalmente el horario para evitar dobles solicitudes.
- Confirmar formaliza la reserva.

## 11. Flujo 9 - Rechazar una solicitud pendiente

Objetivo del video: mostrar que el admin puede rechazar solicitudes que no corresponden.

Precondiciones:

- Existe un turno en estado `PENDING`.

Pasos:

1. Entrar a `Turnos`.
2. Filtrar por `Pendientes`.
3. Abrir el detalle del turno.
4. Seleccionar `Rechazar turno`.
5. Ingresar un motivo.
6. Confirmar.
7. Verificar que el turno pasa a `Rechazado`.
8. Volver a `Agenda` y revisar que el horario queda liberado si no hay otro bloqueo o turno activo.

Resultado esperado:

- El turno pasa de `PENDING` a `REJECTED`.
- Se guarda `rejectionReason`.
- El horario deja de estar ocupado por ese turno.

Puntos para narrar:

- `REJECTED` aplica a solicitudes pendientes que nunca se confirmaron.
- Es distinto de cancelar un turno confirmado.
- El motivo deja trazabilidad para atencion al cliente.

## 12. Flujo 10 - Cancelar un turno desde admin

Objetivo del video: mostrar cancelacion operativa por decision del negocio.

Precondiciones:

- Existe un turno `PENDING` o `CONFIRMED`.

Pasos:

1. Entrar a `Turnos`.
2. Buscar el turno por fecha, profesional, cliente o estado.
3. Abrir `Ver detalle`.
4. Seleccionar `Cancelar turno`.
5. Ingresar el motivo.
6. Confirmar.
7. Verificar que el estado pasa a `Cancelado admin`.
8. Revisar en `Agenda` que el horario queda libre si no existe bloqueo.

Resultado esperado:

- El turno pasa a `CANCELED_BY_ADMIN`.
- Se guarda `cancelReason` y `canceledAt`.
- El turno queda en historial.
- El horario vuelve a estar disponible salvo que se cree un bloqueo.

Puntos para narrar:

- Cancelar no elimina el turno.
- Si la cancelacion se debe a que el profesional no atiende, conviene crear tambien un bloqueo para ese rango.
- La cancelacion por admin es una accion final.

## 13. Flujo 11 - Completar un turno atendido

Objetivo del video: mostrar el cierre normal de un turno que se realizo.

Precondiciones:

- Existe un turno `CONFIRMED`.
- El turno ya fue atendido o se esta haciendo cierre operativo.

Pasos:

1. Entrar a `Turnos`.
2. Filtrar por `Confirmados` o buscar el dia correspondiente.
3. Abrir el detalle.
4. Seleccionar `Completar turno`.
5. Confirmar.
6. Verificar que el turno pasa a `Completado`.

Resultado esperado:

- El turno pasa de `CONFIRMED` a `COMPLETED`.
- Se registra `completedAt`.
- El turno queda como historial.

Puntos para narrar:

- Completar sirve para cerrar agenda real y tener historial operativo.
- Un turno completado no debe volver a cambiar de estado.
- El sistema conserva el dato para consultas futuras.

## 14. Flujo 12 - Marcar no asistio

Objetivo del video: mostrar como registrar ausencias.

Precondiciones:

- Existe un turno `CONFIRMED`.
- El cliente no asistio.

Pasos:

1. Entrar a `Turnos`.
2. Abrir el detalle del turno.
3. Seleccionar `Marcar no asistio`.
4. Confirmar.
5. Verificar que el turno pasa a `No asistio`.

Resultado esperado:

- El turno pasa de `CONFIRMED` a `NO_SHOW`.
- Se registra `noShowAt`.
- El dato queda disponible para historial y seguimiento.

Puntos para narrar:

- No-show es un estado final.
- Permite distinguir ausencias de cancelaciones.
- Ayuda a revisar comportamiento historico de clientes.

## 15. Flujo 13 - Crear un bloqueo de agenda

Objetivo del video: mostrar como cerrar disponibilidad por vacaciones, licencia, feriado o bloqueo manual.

Precondiciones:

- Existe un profesional activo.
- No existen turnos activos superpuestos en el rango a bloquear, o se cancelaron previamente.

Pasos:

1. Entrar a `Bloqueos`.
2. Seleccionar `Nuevo bloqueo`.
3. Elegir profesional.
4. Elegir tipo: vacaciones, licencia medica, feriado, bloqueo manual u otro.
5. Cargar fecha y hora de inicio.
6. Cargar fecha y hora de fin.
7. Agregar motivo opcional.
8. Guardar.
9. Entrar a `Agenda` y verificar que esos horarios ya no aparecen disponibles.

Resultado esperado:

- El bloqueo queda activo.
- Los slots que se superponen al bloqueo desaparecen de disponibilidad.
- El bloqueo no crea un turno, solo afecta agenda.

Puntos para narrar:

- Los bloqueos representan excepciones de disponibilidad.
- Para el MVP, el backend rechaza bloqueos que se superponen con turnos `PENDING` o `CONFIRMED`.
- Desactivar un bloqueo vuelve a liberar los horarios si el profesional tiene horario laboral y no hay turnos activos.

## 16. Flujo 14 - Desactivar un servicio, profesional, horario o bloqueo

Objetivo del video: mostrar baja logica sin perder historial.

Precondiciones:

- Existe un registro activo en servicios, profesionales, horarios o bloqueos.

Pasos:

1. Entrar al catalogo correspondiente.
2. Abrir el menu de acciones.
3. Seleccionar desactivar.
4. Confirmar la accion.
5. Revisar resumen de activos e inactivos.
6. Abrir el modal de inactivos si corresponde.
7. Reactivar el item para mostrar el flujo inverso.

Resultado esperado:

- El item cambia de activo a inactivo o viceversa.
- No se elimina fisicamente.
- El historial relacionado permanece disponible.

Puntos para narrar:

- Desactivar un servicio impide nuevas reservas de ese servicio.
- Desactivar un profesional impide que aparezca para nueva disponibilidad.
- Desactivar un horario deja de generar slots.
- Desactivar un bloqueo deja de afectar disponibilidad.

## 17. Flujo 15 - Consultar turnos con filtros operativos

Objetivo del video: mostrar busqueda y seguimiento diario/semanal.

Precondiciones:

- Existen turnos en distintos estados.

Pasos:

1. Entrar a `Turnos`.
2. Usar tabs rapidos: todos, pendientes, confirmados, completados o cancelados.
3. Aplicar rango de fechas.
4. Filtrar por profesional.
5. Filtrar por cliente.
6. Abrir detalle de un turno.
7. Volver al listado.
8. Usar paginacion si hay muchos resultados.

Resultado esperado:

- El admin puede ver todos los turnos.
- Los filtros se combinan.
- La informacion del detalle muestra estado, origen, notas, motivos y timestamps.

Puntos para narrar:

- Esta pantalla funciona como historial y como tablero operativo.
- Permite seguimiento por cliente, profesional, estado y rango.
- Los turnos finales siguen apareciendo para trazabilidad.

## 18. Flujo 16 - Verificar que la disponibilidad se libera al cancelar o rechazar

Objetivo del video: demostrar la regla de ocupacion de agenda.

Precondiciones:

- Existe un turno `PENDING` o `CONFIRMED` en una semana futura.

Pasos:

1. Entrar a `Agenda` y ubicar el horario ocupado.
2. Entrar a `Turnos`.
3. Cancelar o rechazar el turno, segun su estado.
4. Volver a `Agenda`.
5. Seleccionar mismo servicio, profesional y semana.
6. Verificar que el horario vuelve a aparecer disponible.

Resultado esperado:

- Mientras el turno esta `PENDING` o `CONFIRMED`, ocupa la agenda.
- Al pasar a un estado final que no ocupa disponibilidad, el slot se libera.

Puntos para narrar:

- La agenda no depende solo de si hay un turno, sino del estado del turno.
- Estados activos: `PENDING`, `CONFIRMED`.
- Estados finales que liberan: `REJECTED`, `CANCELED_BY_CLIENT`, `CANCELED_BY_ADMIN`, `COMPLETED`, `NO_SHOW`.

## 19. Flujo 17 - Validar que no se puede tomar un turno fuera de reglas

Objetivo del video: mostrar comportamiento esperado ante errores normales.

Escenarios para mostrar:

- Servicio inactivo: no debe ofrecerse para crear turnos.
- Profesional inactivo: no debe aparecer como opcion valida.
- Profesional incompatible con servicio: no debe aparecer en agenda para ese servicio.
- Sin horario laboral: la agenda no muestra slots.
- Bloqueo activo: la agenda no muestra slots bloqueados.
- Turno superpuesto: el backend rechaza la creacion si otro usuario/admin ocupo el horario.
- Turno en el pasado: el backend rechaza la creacion.

Resultado esperado:

- El admin recibe mensajes claros.
- No se crea un turno invalido.
- La agenda queda consistente.

Puntos para narrar:

- El panel filtra para facilitar el uso.
- El backend vuelve a validar antes de guardar.
- Esto evita dobles reservas y errores de agenda.

## 20. Orden sugerido de videos

1. Login y recorrido general del panel admin.
2. Crear servicios.
3. Crear profesionales y asignar servicios.
4. Definir horarios laborales.
5. Revisar agenda semanal.
6. Crear turno con cliente existente.
7. Crear cliente nuevo y turno.
8. Gestionar solicitudes pendientes.
9. Cancelar, completar y marcar no-show.
10. Crear bloqueos de agenda.
11. Consultar historial con filtros.
12. Casos de validacion y errores esperados.

## 21. Checklist general para probar antes de grabar

- [ ] El admin puede iniciar sesion.
- [ ] Hay servicios activos.
- [ ] Hay profesionales activos.
- [ ] Cada profesional demo tiene horarios laborales.
- [ ] Las asignaciones profesional-servicio son coherentes.
- [ ] La agenda muestra slots disponibles en una semana futura.
- [ ] Crear turno desde agenda funciona.
- [ ] Crear cliente nuevo desde agenda funciona.
- [ ] Confirmar turno pendiente funciona.
- [ ] Rechazar turno pendiente exige motivo.
- [ ] Cancelar turno exige motivo.
- [ ] Completar turno confirmado funciona.
- [ ] Marcar no-show funciona.
- [ ] Crear bloqueo elimina disponibilidad.
- [ ] Desactivar bloqueo vuelve a liberar disponibilidad.
- [ ] Los filtros de turnos devuelven resultados esperados.

## 22. Glosario rapido para narracion

- `Servicio`: tratamiento o prestacion que reserva el cliente.
- `Profesional`: persona que atiende el turno.
- `Horario laboral`: rango semanal donde un profesional atiende.
- `Bloqueo`: excepcion puntual donde el profesional no esta disponible.
- `Slot disponible`: horario calculado donde entra el servicio completo.
- `Turno pendiente`: solicitud creada por cliente y pendiente de revision admin.
- `Turno confirmado`: reserva firme que ocupa agenda.
- `Turno final`: estado que ya no tiene acciones normales disponibles.
- `Compatibilidad`: regla que define si un profesional puede atender un servicio.
