# Decisiones de producto y arquitectura frontend

Este documento registra decisiones detectadas durante la implementacion del frontend. La idea es poder leerlas, discutirlas y cerrarlas antes de que impacten demasiado en pantallas posteriores.

Estados sugeridos:

- `Pendiente`: todavia requiere decision.
- `Provisional`: se eligio una opcion para avanzar, pero puede cambiar.
- `Decidida`: se toma como regla del MVP.

## DEC-01 - Relacion profesional-servicio

Estado: `Pendiente`

Pregunta:

Definir si todos los profesionales pueden realizar todos los servicios o si cada profesional tiene servicios asignados.

Opciones:

- MVP simple: todos los profesionales activos pueden realizar todos los servicios activos.
- Modelo realista: agregar relacion profesional-servicio, por ejemplo `professional_services`.

Impacto:

- Agenda/disponibilidad admin.
- Creacion manual de turnos.
- Flujo cliente.
- Filtros de servicios y profesionales.
- Validaciones backend.
- Datos demo e iniciales.

Recomendacion:

Si BIBE va a tener mas de un profesional o servicios especializados, conviene implementar la relacion profesional-servicio antes del flujo cliente. Si se mantiene el MVP simple, hay que aceptar explicitamente que todos los profesionales hacen todos los servicios.

## DEC-02 - Turnos forzados por admin

Estado: `Provisional`

Pregunta:

Definir si el admin puede crear turnos fuera de disponibilidad.

Opciones:

- No forzar y respetar las reglas actuales del backend.
- Permitir forzar con motivo obligatorio.
- Permitir forzado parcial, por ejemplo fuera de horario si, pero no pisar turnos confirmados.

Impacto:

- Reglas de negocio.
- Integridad de agenda.
- Validaciones backend.
- Auditoria de decisiones del admin.

Decision provisional:

Para el MVP, el admin no fuerza turnos. La creacion manual debe respetar disponibilidad, horarios laborales, bloqueos, turnos existentes, profesional activo, servicio activo y cliente activo.

Posible mejora futura:

Agregar modo de sobreturno/forzado solo para admin, con motivo obligatorio.

## DEC-03 - Vista Agenda admin

Estado: `Provisional`

Pregunta:

Definir que representa la pestaña `Agenda` dentro del admin.

Propuesta actual:

- Vista de disponibilidad semanal.
- Desktop: grilla por dias y horarios.
- Mobile: listado por dias.
- Navegador de semana con flecha anterior, flecha siguiente y rango visible.
- Crear turno desde un slot disponible.

Impacto:

- Operacion diaria del admin.
- Reutilizacion posterior para el flujo cliente.
- Claridad entre `Turnos` como listado operativo y `Agenda` como disponibilidad.

Decision provisional:

Agenda sera una vista semanal de disponibilidad, no un calendario complejo tipo Google Calendar en el MVP.

## DEC-04 - Calendario complejo vs listado MVP

Estado: `Provisional`

Pregunta:

Definir si el admin necesita calendario visual completo o si alcanza con listado/agenda simple para el MVP.

Opciones:

- MVP: listado de turnos + grilla semanal de disponibilidad.
- Calendario complejo: vista tipo calendario semanal/mensual con drag and drop o interacciones avanzadas.

Impacto:

- Tiempo de implementacion.
- Complejidad visual y responsive.
- Riesgo de bugs en interacciones de calendario.

Decision provisional:

Usar listado operativo y grilla semanal de disponibilidad. No implementar calendario complejo al inicio.

## DEC-05 - Formularios en mobile

Estado: `Pendiente`

Pregunta:

Definir como se crean y editan entidades en pantallas mobile.

Opciones:

- Formulario inline dentro de la pagina.
- Modal.
- Drawer o panel inferior.

Impacto:

- Catalogos administrativos.
- Creacion de turnos.
- Edicion de entidades en listados largos.
- Ergonomia mobile.

Recomendacion:

Usar modal o drawer en mobile para creacion/edicion. En desktop se puede evaluar inline, modal o panel lateral segun la pantalla.

## DEC-06 - Elementos desactivados

Estado: `Pendiente`

Pregunta:

Definir como mostrar servicios, profesionales, clientes, horarios y bloqueos desactivados.

Opciones:

- Mezclarlos en la lista principal.
- Agregar filtro `Activos / Inactivos / Todos`.
- Agregar boton o seccion secundaria `Desactivados`.

Impacto:

- Limpieza visual de la operacion diaria.
- Reactivacion de elementos historicos.
- Claridad entre datos disponibles y datos archivados.

Recomendacion:

Mostrar por defecto elementos activos en la lista principal y dejar los desactivados en una vista, filtro o boton secundario desde donde puedan reactivarse.

## DEC-07 - Busqueda global del header

Estado: `Pendiente`

Pregunta:

Definir si la barra de busqueda superior del admin busca realmente o si debe ocultarse hasta que tenga funcionalidad.

Opciones:

- Implementar busqueda global real.
- Convertirla en busqueda contextual por pantalla.
- Ocultarla temporalmente.

Impacto:

- Expectativa del usuario.
- Consistencia visual del admin.
- Necesidad de endpoints o busqueda local por pantalla.

Recomendacion:

Ocultarla temporalmente o convertirla en busqueda contextual si no se implementa busqueda global real en el MVP.

## DEC-08 - Acciones rapidas del dashboard

Estado: `Provisional`

Pregunta:

Definir si las acciones rapidas del dashboard navegan a pantallas o abren modales directos.

Opciones:

- Navegar a la pantalla correspondiente.
- Abrir modal directo.
- Mezcla: navegar para flujos complejos, modal para acciones simples.

Impacto:

- Dashboard.
- Creacion de turnos.
- Registro de clientes.
- Consulta de disponibilidad.

Decision provisional:

Por ahora navegan a la pantalla correspondiente:

- Crear turno manual -> `Turnos`.
- Registrar cliente -> `Clientes`.
- Revisar disponibilidad -> `Agenda`.

## DEC-09 - Flujo cliente para pedir turno

Estado: `Pendiente`

Pregunta:

Definir como pide turno un cliente.

Opciones:

- Cliente elige servicio y el sistema asigna profesional.
- Cliente elige servicio y luego profesional disponible.
- Cliente elige profesional y luego servicio.

Impacto:

- Flujo de reserva cliente.
- Necesidad de relacion profesional-servicio.
- Disponibilidad mostrada al cliente.
- Simplicidad del MVP.

Recomendacion:

Depende de DEC-01. Si existe relacion profesional-servicio, elegir primero servicio suele ser mas natural para el cliente.

## DEC-10 - Disponibilidad visible para cliente

Estado: `Pendiente`

Pregunta:

Definir cuanto detalle ve el cliente al elegir turno.

Opciones:

- Solo horarios disponibles.
- Dias disponibles y luego horarios.
- Calendario semanal simple.
- No mostrar profesional, solo confirmar turno.

Impacto:

- Experiencia cliente.
- Reutilizacion de la vista de disponibilidad admin.
- Cantidad de decisiones que debe tomar el cliente.

Recomendacion:

Mostrar dias y horarios disponibles, ocultando detalles operativos del admin. El cliente deberia ver una experiencia mas guiada.

## DEC-11 - Precio de servicios

Estado: `Provisional`

Pregunta:

Definir si el precio de servicios impacta en turnos o solo es informacion.

Estado actual:

El sistema se centra en organizar turnos y llevar registro. El precio existe como dato del servicio, pero no es prioridad funcional.

Impacto:

- Visualizacion de servicios.
- Historial de turnos.
- Posible precio al momento de reservar.

Decision provisional:

Mantener precio como dato informativo por ahora. No bloquear el avance del sistema por reglas de precios.

## DEC-12 - Confirmaciones y motivos

Estado: `Provisional`

Pregunta:

Definir que acciones requieren confirmacion o motivo.

Propuesta:

- Confirmar turno: accion directa.
- Completar turno: accion directa o confirmacion simple.
- Rechazar turno: motivo obligatorio.
- Cancelar turno como admin: motivo obligatorio.
- Marcar no-show: confirmacion simple.
- Desactivar entidades: confirmacion simple.

Impacto:

- Operacion admin.
- Auditoria de cambios.
- Prevencion de errores.
- Calidad del historial.

Decision provisional:

Usar motivo obligatorio para rechazo y cancelacion. Mantener confirmacion/completar como acciones simples por ahora, revisando si necesitan confirmacion visual antes del MVP.
