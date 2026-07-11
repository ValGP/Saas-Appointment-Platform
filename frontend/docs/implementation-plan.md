# Plan tecnico de implementacion del frontend

Este documento organiza el desarrollo del frontend para el sistema de turnos de BIBE Estetica.

La idea es construir un proyecto fullstack donde el backend actual se mantenga como base estable y el frontend se agregue de manera ordenada, sin interferir con la logica ya implementada.

El frontend se pensara en tres superficies principales:

- Sitio publico del negocio.
- Area de cliente para solicitar y consultar turnos.
- Panel administrativo para operar servicios, profesionales, horarios, bloqueos y turnos.

## 0. Estado visual por fases

- [x] Fase 0 - Preparacion del proyecto frontend.
- [x] Fase 1 - Autenticacion y sesion.
- [x] Fase 2 - Panel admin base responsive con dark/light mode.
- [x] Fase 3 - Catalogos administrativos.
- [x] Fase 4 - Agenda y turnos admin.
- [x] Fase 4.1 - Cierre operativo del admin antes del cliente.
- [x] Fase 4.2 - Relacion profesional-servicio e interfaces de asignacion.
- [x] Fase 4.3 - Seguridad operativa y mejoras UX del admin.
- [x] Fase 4.4 - Pulido operativo advanced del admin.
- [x] Fase 4.5 - Correcciones UX post-prueba del admin.
- [x] Fase 5 - Flujo cliente para solicitar turno.
- [x] Fase 6 - Area cliente. Completada.
- [x] Fase 7 - Sitio publico y definicion estetica. Completada.
- [x] Fase 8 - Pulido y calidad. Completada.

## 1. Criterio general

El frontend no deberia empezar como una landing decorativa grande. El sistema necesita una experiencia util: mostrar el negocio, permitir que un cliente pida turno y darle al admin una herramienta clara para trabajar.

Toda la aplicacion debe ser responsive desde el inicio. Cada pantalla, layout, formulario, tabla, listado, dashboard y flujo debe poder usarse correctamente en PC de escritorio, notebook, tablet y mobile.

Decision recomendada:

- Priorizar primero el panel administrativo.
- Construir despues el flujo de solicitud de turnos del cliente.
- Dejar el sitio publico simple, elegante y suficiente para presentar el negocio.

Motivo:

- El backend ya tiene mucha capacidad administrativa.
- El negocio necesita cargar servicios, profesionales y horarios antes de que el cliente pueda pedir turnos bien.
- El panel admin permite probar casi todo el backend desde una interfaz real.

## 2. Arquitectura de pantallas

### 2.1 Sitio publico

Ruta sugerida:

```text
/
```

Objetivo:

Mostrar BIBE Estetica como negocio y llevar al usuario hacia la accion principal: solicitar un turno.

Contenido inicial:

- Presentacion del negocio.
- Servicios destacados.
- Informacion basica de contacto.
- Horarios o referencia de atencion.
- Boton para solicitar turno.
- Accesos de login y registro.

Juicio inicial:

La pagina publica deberia ser una SPA o una home dentro de la app, pero no deberia mezclar componentes internos de administracion. Puede convivir en el mismo proyecto React, pero conceptualmente es una superficie separada.

### 2.2 Autenticacion

Rutas sugeridas:

```text
/login
/register
```

Objetivo:

Permitir que clientes y administradores entren al sistema.

Decision recomendada:

Login y registro deben estar fuera de la pagina publica, como rutas propias. No conviene que sean modales dentro de la home en esta etapa, porque despues el flujo de redireccion por rol se vuelve mas confuso.

Comportamiento esperado:

- Si inicia sesion un `ADMIN`, redirigir a `/admin`.
- Si inicia sesion un `CLIENT`, redirigir a `/app`.
- Si un usuario ya autenticado entra a `/login`, redirigir segun su rol.
- Si el login falla, mostrar error claro.

Registro:

- Solo registra clientes.
- Despues de registrarse, el usuario queda logueado automaticamente si el backend devuelve token.
- El token se guarda igual que en login y se redirige al area de cliente.

### 2.3 Area de cliente

Ruta base sugerida:

```text
/app
```

Subrutas sugeridas:

```text
/app/book
/app/appointments
/app/profile
```

Objetivo:

Permitir que el cliente solicite turnos de manera sencilla y consulte sus turnos.

Flujo principal para solicitar turno:

1. Elegir servicio.
2. El sistema sugiere/asigna profesional disponible.
3. Elegir fecha dentro de la ventana visible.
4. Ver horarios disponibles.
5. Confirmar solicitud.
6. Ver estado `PENDING`.

Juicio inicial:

El flujo debe explicar de forma natural que el turno queda pendiente de confirmacion. Esto es importante porque el backend ya define que los turnos creados por cliente nacen como `PENDING`.

Pantallas iniciales:

- Solicitar turno.
- Mis turnos.
- Mi perfil.

Estados importantes:

- Sin servicios disponibles.
- Sin horarios disponibles para la fecha.
- Turno solicitado correctamente.
- Turno pendiente de confirmacion.
- Turno confirmado.
- Turno cancelado.

### 2.4 Panel administrativo

Ruta base sugerida:

```text
/admin
```

Subrutas sugeridas:

```text
/admin/dashboard
/admin/appointments
/admin/calendar
/admin/services
/admin/professionals
/admin/business-hours
/admin/availability-blocks
/admin/clients
```

Objetivo:

Dar al administrador una herramienta de trabajo diaria.

Decision recomendada:

El panel admin debe vivir en una URL especifica (`/admin`) y no necesita un boton publico visible en la home. Si un admin inicia sesion desde `/login`, se lo redirige automaticamente al panel.

Motivo:

- Evita ensuciar la web publica con un acceso interno.
- Mantiene una separacion clara entre cliente y operacion del negocio.
- Sigue siendo facil de acceder para el admin escribiendo `/login` o `/admin`.

Prioridad:

El panel admin deberia ser la primera gran fase del frontend.

## 3. Navegacion y proteccion de rutas

Rutas publicas:

```text
/
/login
/register
```

Rutas protegidas para cliente:

```text
/app/*
```

Rutas protegidas para admin:

```text
/admin/*
```

Reglas:

- Sin token, las rutas protegidas redirigen a `/login`.
- Con token de `CLIENT`, `/admin/*` redirige a `/app`.
- Con token de `ADMIN`, `/app/*` redirige a `/admin`.
- El rol debe obtenerse desde el token o desde `GET /api/users/me`.

Decision recomendada:

Usar `GET /api/users/me` como fuente confiable al iniciar la app. Aunque el token tenga rol, la app debe poder validar usuario activo y datos actuales.

## 3.1 Responsive y adaptacion por dispositivo

La experiencia debe considerarse completa solo si funciona bien en:

- PC de escritorio.
- Notebook.
- Tablet.
- Mobile.

Reglas:

- Los layouts deben adaptarse sin romper contenido ni controles.
- El panel admin debe tener navegacion usable en pantallas chicas, por ejemplo sidebar compacta, navegacion horizontal o drawer segun convenga.
- Las tablas y listados deben transformarse en vistas escaneables en mobile, evitando overflow horizontal obligatorio salvo casos muy justificados.
- Los formularios deben mantener campos, errores y acciones visibles y comodos de usar en pantallas chicas.
- Los botones, inputs, filtros y acciones deben conservar tamanos tactiles razonables.
- No debe haber superposiciones de texto, cards, headers, modales o controles.
- Antes de cerrar cada fase visual o funcional, se debe probar al menos en desktop/notebook y mobile; tablet debe revisarse cuando haya layouts de multiples columnas.

## 3.2 Posibles mejoras UX a evaluar

Esta seccion funciona como lista de ideas para revisar y decidir mas adelante. No implica implementarlas automaticamente.

- En mobile, abrir los formularios de creacion/edicion de catalogos en modal o drawer en lugar de insertarlos dentro de la pagina. Esto puede ser mas comodo cuando hay listados largos de servicios, profesionales, clientes, horarios o bloqueos.
- En desktop, evaluar si conviene mantener formularios inline, usar panel lateral o modal segun la cantidad de campos de cada pantalla.
- Agregar confirmaciones claras antes de desactivar servicios, profesionales, clientes, horarios o bloqueos, explicando que no se borran del historial.
- Evaluar una vista, boton o filtro de "desactivados" al final del listado o en una zona secundaria. La idea es que los elementos inactivos no ensucien la visual principal de trabajo, pero sigan accesibles para consultarlos o reactivarlos cuando haga falta.
- Mejorar busqueda y filtros dentro de catalogos administrativos cuando las listas crezcan.
- Agregar acciones rapidas visibles en mobile sin saturar las cards, por ejemplo editar/desactivar desde un menu compacto.
- Revisar estados vacios para que expliquen el siguiente paso util sin parecer mensajes tecnicos.
- Evaluar feedback visual con toasts o banners despues de crear, editar o desactivar entidades.
- Revisar si algunas pantallas necesitan scroll automatico hacia el formulario cuando se edita desde desktop/tablet y no se usa modal.

## 4. Integracion con backend

Backend actual esperado:

```text
http://localhost:8080
```

Endpoints principales que usara el frontend:

Autenticacion:

```http
POST /auth/login
POST /auth/register
GET /api/users/me
```

Servicios:

```http
GET /api/services
POST /api/services
PUT /api/services/{id}
PATCH /api/services/{id}/activate
PATCH /api/services/{id}/deactivate
```

Profesionales:

```http
GET /api/professionals
POST /api/professionals
PUT /api/professionals/{id}
PATCH /api/professionals/{id}/activate
PATCH /api/professionals/{id}/deactivate
```

Horarios:

```http
GET /api/business-hours
POST /api/business-hours
PUT /api/business-hours/{id}
PATCH /api/business-hours/{id}/activate
PATCH /api/business-hours/{id}/deactivate
```

Bloqueos:

```http
GET /api/availability-blocks
POST /api/availability-blocks
PUT /api/availability-blocks/{id}
PATCH /api/availability-blocks/{id}/activate
PATCH /api/availability-blocks/{id}/deactivate
```

Disponibilidad:

```http
GET /api/availability?professionalId=1&serviceId=2&date=2026-05-26
```

Turnos:

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

## 5. Stack frontend recomendado

Decision inicial recomendada:

- React.
- TypeScript.
- Vite.
- React Router.
- TanStack Query para estado de servidor.
- React Hook Form para formularios.
- Zod para validaciones de formulario.
- Un sistema simple de estilos a definir.

Decision tomada:

- React + TypeScript sera la base del frontend.
- TailAdmin se usara como referencia principal o base visual para el panel administrativo, siempre que su estructura tecnica encaje bien.
- El panel debe soportar modo dark y modo light desde el inicio o desde una fase temprana.

Juicio inicial:

Para avanzar rapido y mantener calidad, conviene usar React + TypeScript + Vite. Para UI, Tailwind + componentes propios o shadcn/ui puede funcionar bien, siempre que no se convierta en una dependencia visual rigida. Como es una estetica, el diseno visual importa, pero el admin debe ser sobrio y operativo.

Nota sobre TailAdmin:

TailAdmin gusta visualmente y puede servir como punto de partida para el panel administrativo si su licencia y estructura encajan con el proyecto. La decision tecnica no debe tomarse solo por apariencia: hay que revisar si permite integrarse bien con React, TypeScript, React Router, formularios, estados de carga, tablas y permisos por rol sin pelearse con la arquitectura.

El objetivo no es copiar una plantilla generica sin adaptacion. La idea es replicar/adaptar su lenguaje visual al sistema de turnos:

- Sidebar operativo.
- Header con busqueda o acciones utiles.
- Tarjetas de resumen.
- Tablas y listados limpios.
- Dark/light mode.
- Componentes reutilizables para formularios, filtros y estados.

Decision visual inicial:

- El estilo general buscado sera premium y calido.
- El diseno visual se definira con mas detalle cuando llegue la fase correspondiente.
- Antes de empezar la fase de sitio publico o pulido visual, se debe pausar y definir criterios de estetica, paleta, tono, componentes y referencias visuales.

## 6. Diseno de experiencia por rol

### 6.1 Visitante

Puede:

- Ver informacion del negocio.
- Ver servicios destacados.
- Ir a login.
- Registrarse.
- Iniciar solicitud de turno.

No puede:

- Confirmar turno sin autenticarse.
- Ver disponibilidad sin autenticarse.
- Avanzar en el flujo de reserva sin cuenta.

Decision tomada:

El visitante puede ver informacion publica y servicios, pero no puede consultar disponibilidad ni solicitar turnos sin registrarse o iniciar sesion.

Recomendacion:

La home y la seccion de servicios deben vender bien lo que ofrece el negocio. El flujo de turno empieza realmente despues de autenticarse, para evitar guardar selecciones temporales de visitantes y simplificar la consistencia de disponibilidad.

### 6.2 Cliente

Puede:

- Solicitar turno.
- Ver sus turnos.
- Cancelar sus turnos cuando el backend lo permita.
- Ver su perfil.
- Ver disponibilidad solo despues de iniciar sesion.

No puede:

- Modificar servicios.
- Modificar profesionales.
- Confirmar turnos.
- Ver turnos de otros clientes.
- Elegir profesional en el MVP.

Decision tomada:

El sistema sugerira/asignara el profesional disponible para el primer MVP. La seleccion manual de profesional queda como mejora futura porque en otros negocios puede ser importante.

### 6.3 Administrador

Puede:

- Ver resumen de turnos.
- Ver agenda.
- Confirmar, rechazar, cancelar, completar y marcar no-show.
- Crear turnos manuales.
- Gestionar clientes desde el primer MVP.
- Administrar servicios.
- Administrar profesionales.
- Administrar horarios laborales.
- Administrar bloqueos de agenda.
- Consultar historial.

No necesita:

- Un boton publico visible en la home.
- Registro publico como admin.

## 7. Fases de implementacion

### Fase 0 - Preparacion del proyecto frontend

Objetivo:

Crear la base tecnica del frontend sin implementar todavia todas las pantallas.

Tareas:

- Crear proyecto Vite + React + TypeScript.
- Configurar estructura de carpetas.
- Configurar router.
- Configurar cliente HTTP.
- Configurar manejo de token.
- Configurar layout publico, layout cliente y layout admin.
- Configurar variables de entorno.
- Crear estilos base.

Salida esperada:

- La app levanta localmente.
- Existen rutas base.
- Se puede navegar entre pantallas placeholder.

### Fase 1 - Autenticacion y sesion

Objetivo:

Conectar login, registro y usuario actual contra el backend.

Tareas:

- Pantalla de login.
- Pantalla de registro.
- Guardado de token.
- Carga de usuario actual con `/api/users/me`.
- Redireccion segun rol.
- Proteccion de rutas.
- Logout.

Salida esperada:

- Admin entra a `/admin`.
- Cliente entra a `/app`.
- Rutas protegidas funcionan.

### Fase 2 - Panel admin base

Objetivo:

Construir la estructura operativa del admin.

Tareas:

- Layout admin con navegacion lateral o superior.
- Dashboard inicial.
- Listado de turnos de la semana actual y la semana siguiente.
- Acciones rapidas.
- Manejo de estados de carga y error.
- Evaluar TailAdmin como base visual y tecnica del shell administrativo.

Salida esperada:

- El admin tiene una base real para operar.

### Fase 3 - Catalogos administrativos

Objetivo:

Permitir configurar la informacion necesaria para operar la agenda.

Tareas:

- CRUD de servicios.
- CRUD de profesionales.
- Gestion de clientes desde admin.
- CRUD de horarios laborales.
- CRUD de bloqueos de agenda.
- Activar/desactivar entidades.
- Formularios con validaciones.
- Mensajes de error del backend legibles.

Salida esperada:

- El admin puede preparar el sistema para recibir turnos.

### Fase 4 - Agenda y turnos admin

Objetivo:

Permitir al admin gestionar turnos desde una interfaz clara.

Tareas:

- Listado filtrable de turnos.
- Vista tipo agenda/listado, no calendario complejo en el MVP.
- Mostrar inicialmente turnos de la semana actual y la semana siguiente.
- Crear turno manual desde Agenda/Disponibilidad, eligiendo un slot disponible.
- Confirmar turno pendiente.
- Rechazar turno pendiente.
- Cancelar turno.
- Completar turno.
- Marcar no-show.
- Filtros por fecha, profesional, cliente y estado.

Salida esperada:

- El admin puede operar el ciclo completo de turnos.

### Fase 4.1 - Cierre operativo del admin antes del cliente

Estado:

- Cerrada como base operativa del admin. Turnos queda como listado/acciones de estado; la creacion de turnos se inicia desde Agenda sobre disponibilidad real.
- Agenda ya consume disponibilidad semanal por profesional/servicio, muestra semana actual por defecto, permite navegar semanas y abre modal de creacion desde slots disponibles.
- La disponibilidad respeta la relacion profesional-servicio expuesta por backend mediante filtros compatibles.

Objetivo:

Cerrar huecos funcionales y de UX del panel administrativo antes de pasar al flujo cliente. Esta fase existe para que el admin quede como herramienta coherente, no como una suma de pantallas sueltas.

Tareas:

- Renombrar o aclarar el boton "Ventana inicial" de turnos. Su funcion actual es restablecer filtros a semana actual y semana siguiente; el texto deberia comunicarlo mejor, por ejemplo "Restablecer 14 dias" o "Semana actual + proxima".
- Definir el rol de la pestaña `/admin/calendar` o "Agenda". Para el MVP deberia convertirse en una vista de disponibilidad, no en un calendario complejo.
- Implementar en Agenda una consulta de disponibilidad por profesional, servicio y fecha usando `GET /api/availability`.
- Mostrar slots disponibles de forma clara para el admin, con estados vacios y errores entendibles.
- Permitir que desde la vista de disponibilidad se pueda iniciar la creacion de un turno manual usando el slot seleccionado.
- Mantener para el MVP la regla actual del backend: el admin no fuerza turnos fuera de disponibilidad. La creacion manual debe respetar horarios laborales, bloqueos, turnos existentes, profesional activo, servicio activo y cliente activo. La opcion de "forzar turno" queda como posible mejora futura de backend, idealmente con motivo obligatorio.
- Disenar la vista Agenda/Disponibilidad con una vista semanal:
  - En desktop, mostrar una grilla por semana con columnas por dia (`Lunes`, `Martes`, `Miercoles`, etc.) y filas por horarios (`09:00`, `09:30`, etc.).
  - En cada celda o bloque horario, diferenciar horarios disponibles, turnos ocupados y espacios sin disponibilidad.
  - Si hay un turno ocupado, mostrar una referencia breve del turno, por ejemplo cliente/servicio o un texto tipo "Turno demo".
  - Si el slot esta disponible, permitir seleccionarlo para abrir la creacion de turno con profesional, servicio, fecha y hora precargados.
  - En mobile, reemplazar la grilla por un listado por dias: `Lunes`, luego sus horarios/turnos; `Martes`, luego sus horarios/turnos; y asi sucesivamente, evitando overflow horizontal pesado.
  - Agregar un cambiador de semana arriba de la vista con flecha para semana anterior, flecha para semana siguiente y texto de rango, por ejemplo `Semana del 25/05 al 31/05`.
  - La vista debe iniciar siempre mostrando la semana actual.
  - Si el admin navega a otra semana, evaluar un boton para volver rapido a la semana actual.
  - La vista debe usar filtros de profesional y servicio, porque la disponibilidad depende de ambos.
- Conectar las acciones rapidas del dashboard:
  - "Crear turno manual" debe navegar al flujo real de Agenda/Disponibilidad.
  - "Registrar cliente" debe llevar a clientes y abrir/indicar alta de cliente.
  - "Revisar disponibilidad" debe llevar a la vista Agenda/disponibilidad.
- Revisar si la busqueda global del header queda como placeholder o si debe ocultarse hasta tener una busqueda real.
- Revisar labels y microcopy de filtros y acciones para que no sean ambiguos.
- Revisar que no queden placeholders visibles en rutas admin principales.
- Revisar responsive mobile/tablet de Turnos y Agenda.
- Verificar que servicios, profesionales, clientes, horarios, bloqueos, turnos y disponibilidad cubran el flujo administrativo completo antes de avanzar a cliente.

Salida esperada:

- El admin puede cargar datos base, revisar disponibilidad, crear turnos y operar estados sin depender de pantallas placeholder.
- El flujo administrativo queda suficientemente cerrado como base para construir despues la reserva del cliente reutilizando disponibilidad y reglas ya probadas.

### Fase 4.2 - Relacion profesional-servicio e interfaces de asignacion

Estado:

- Cerrada. Los formularios administrativos de creacion/edicion ahora se abren en modal para mantener la misma experiencia en desktop, tablet y mobile.
- Profesionales permite elegir entre `Todos los servicios` y `Seleccionar servicios`.
- Servicios permite elegir entre `Todos los profesionales` y `Seleccionar profesionales`.
- Agenda/Disponibilidad ya usa los filtros compatibles del backend para evitar combinaciones no validas.

Objetivo:

Completar las interfaces administrativas para asignar servicios a profesionales y profesionales a servicios. El backend ya incorporo la relacion y la Fase 4.1 ya usa los filtros compatibles en Agenda.

Contexto:

Durante la implementacion de Agenda/Disponibilidad se detecto que la relacion profesional-servicio es importante para evitar combinaciones poco validas. El backend ya permite un modelo hibrido: por defecto todos con todos, o seleccion explicita cuando haga falta.

Decision de producto sugerida:

Usar un modelo hibrido:

- Por defecto, un profesional puede atender todos los servicios.
- Opcionalmente, el admin puede limitar un profesional a servicios especificos.
- Al crear un servicio nuevo, se debe poder definir si queda disponible para todos los profesionales o solo para profesionales seleccionados.

Tareas frontend:

- En creacion/edicion de profesionales, agregar una interfaz de decision. Implementado:
  - `Atiende todos los servicios`.
  - `Atiende servicios especificos`.
  - Si elige servicios especificos, mostrar selector/checklist de servicios.
- En creacion/edicion de servicios, agregar una interfaz equivalente. Implementado:
  - `Asignar a todos los profesionales`.
  - `Asignar solo a profesionales seleccionados`.
- Ajustar Agenda/Disponibilidad para que los selects se filtren segun la relacion. Implementado:
  - Si se elige servicio, mostrar profesionales compatibles.
  - Si se elige profesional, mostrar servicios compatibles.
- Ajustar creacion manual de turnos para impedir combinaciones profesional-servicio no habilitadas antes de enviar al backend. Implementado mediante filtros de Agenda y validacion del backend.
- Ajustar futuro flujo cliente para usar primero servicios y luego profesionales/slots compatibles.
- Agregar estados vacios claros cuando no haya profesionales compatibles con un servicio o servicios compatibles con un profesional. Implementado en Agenda y selectores.

Endpoints backend disponibles:

- `GET /api/professionals?serviceId={id}`.
- `GET /api/services?professionalId={id}`.
- `GET /api/professionals/{id}/services`.
- `PUT /api/professionals/{id}/services`.
- `GET /api/services/{id}/professionals`.
- `PUT /api/services/{id}/professionals`.
- Backend valida combinaciones al crear turnos y disponibilidad devuelve vacio si la combinacion no corresponde.

### Fase 4.3 - Seguridad operativa y mejoras UX del admin

Objetivo:

Pulir el panel admin para evitar acciones accidentales, aclarar estados y mejorar flujos de uso reales antes de pasar al modulo cliente. Esta fase se divide en mini-fases para implementar y probar por zonas.

Principios:

- Toda accion que cambie estado debe pedir confirmacion. Aunque no sea destructiva, algunas acciones no tienen vuelta atras simple, por ejemplo confirmar, completar o marcar no-show un turno.
- Las acciones exitosas deben mostrar feedback visible durante unos segundos.
- Los listados principales deben priorizar elementos activos y dejar los inactivos en una vista secundaria.
- Agenda debe partir desde el servicio y luego profesional, porque el usuario normalmente consulta por servicio antes de conocer quien lo atiende.
- Los filtros deben poder restablecerse de forma clara.

#### Fase 4.3.1 - Confirmaciones y feedback global

Estado:

- Cerrada. Hay modal reutilizable de confirmacion y toast/banner temporal para acciones exitosas.

Alcance:

- Crear un modal reutilizable de confirmacion para acciones sensibles. Implementado.
- Crear un sistema simple de toast/banner de exito. Implementado.
- Aplicar confirmacion a:
  - confirmar turno. Implementado.
  - rechazar turno. Implementado.
  - cancelar turno. Implementado.
  - completar turno. Implementado.
  - marcar no-show. Implementado.
  - desactivar/reactivar servicio. Implementado.
  - desactivar/reactivar profesional. Implementado.
  - desactivar/reactivar cliente. Implementado.
  - desactivar/reactivar horario. Implementado.
  - desactivar/reactivar bloqueo. Implementado.
- Mostrar feedback despues de acciones importantes, por ejemplo:
  - `Turno confirmado`.
  - `Servicio desactivado`.
  - `Profesional reactivado`.
  - `Horario guardado`.

Salida esperada:

- El admin no puede cambiar estados por accidente.
- Cada accion exitosa deja una confirmacion visual temporal.

#### Fase 4.3.2 - Agenda mas clara y filtros restablecibles

Estado:

- Cerrada. Agenda ahora prioriza servicio, despues profesional compatible, permite restablecer filtros dejando la agenda sin seleccion y muestra resumen completo antes de crear turno.

Alcance:

- Reordenar filtros de Agenda para ir primero por `Servicio` y despues `Profesional`. Implementado.
- Mantener el filtrado compatible: al elegir servicio, se muestran solo profesionales compatibles. Implementado.
- Agregar accion `Restablecer filtros` o equivalente:
  - vuelve a la semana actual. Implementado.
  - deja servicio sin seleccionar. Implementado.
  - deja profesional sin seleccionar. Implementado.
- Agregar estados vacios mas explicitos:
  - no hay profesionales compatibles con este servicio. Implementado.
  - no hay servicios activos. Implementado.
  - no hay horarios cargados para este profesional. Implementado como mensaje operativo de horarios/disponibilidad.
  - no hay disponibilidad por bloqueos o turnos ocupados. Implementado como mensaje operativo de disponibilidad semanal.
- En el modal de crear turno desde Agenda, mostrar un resumen superior antes de guardar. Implementado:
  - cliente seleccionado.
  - profesional.
  - servicio.
  - dia y horario.

Salida esperada:

- El admin entiende por que ve o no ve disponibilidad.
- Crear turno desde Agenda tiene una confirmacion visual del contexto antes de guardar.

#### Fase 4.3.3 - Activos e inactivos en catalogos

Estado:

- Cerrada. Los listados principales muestran activos por defecto y los inactivos se consultan desde modal con reactivacion confirmada.

Alcance:

- En pantallas con entidades desactivables, el listado principal debe mostrar activos por defecto. Implementado.
- Agregar un boton o accion secundaria para ver inactivos:
  - servicios inactivos. Implementado.
  - profesionales inactivos. Implementado.
  - clientes inactivos. Implementado.
  - horarios inactivos. Implementado.
  - bloqueos inactivos. Implementado.
- La vista de inactivos puede abrirse como modal. Implementado.
- Desde ese modal se puede reactivar, siempre con confirmacion. Implementado.
- Mantener conteos o indicadores para que el admin sepa que existen elementos inactivos sin ensuciar la vista principal. Implementado.

Salida esperada:

- Los listados diarios quedan limpios.
- Reactivar algo sigue siendo facil y controlado.

#### Fase 4.3.4 - Horarios por profesional

Estado:

- Cerrada. Horarios ahora se navega por profesional, y el alta toma el profesional seleccionado.

Alcance:

- Reorganizar la seccion Horarios para elegir primero un profesional. Implementado.
- Mostrar en la lista solo los horarios del profesional seleccionado. Implementado.
- El boton `Nuevo horario` debe abrir el modal con ese profesional preseleccionado. Implementado.
- Mantener posibilidad de cambiar profesional dentro del modal si hace falta. Implementado.
- Agregar restablecer filtro o selector claro cuando no haya profesional cargado. Implementado.

Salida esperada:

- Horarios deja de verse como una lista mezclada y pasa a ser una vista operativa por profesional.

#### Fase 4.3.5 - Historial de turnos desde Clientes

Estado:

- Cerrada. Clientes permite abrir un historial de turnos filtrado por cliente desde la lista.

Alcance:

- En la lista de clientes, agregar accion para ver historial de turnos. Implementado.
- Abrir un modal o vista secundaria con turnos del cliente. Implementado como modal.
- Mostrar datos minimos:
  - fecha y hora. Implementado.
  - servicio. Implementado.
  - profesional. Implementado.
  - estado. Implementado.
  - notas si existen. Implementado.
- Reutilizar `GET /api/appointments` con filtro `clientId` si alcanza para el MVP. Implementado.

Salida esperada:

- El admin puede consultar rapidamente el historial de una persona sin salir de Clientes.

Orden recomendado:

1. Fase 4.3.1, porque el modal de confirmacion y los toasts se reutilizan en todo lo demas.
2. Fase 4.3.2, porque Agenda es el flujo central de creacion de turnos.
3. Fase 4.3.3, porque limpia todos los catalogos y aprovecha confirmaciones.
4. Fase 4.3.4, porque mejora una zona puntual que hoy se vuelve dificil de leer.
5. Fase 4.3.5, porque suma mucho valor operativo pero depende menos del flujo principal.

### Fase 4.4 - Pulido operativo avanzado del admin

Objetivo:

Hacer que el panel admin sea mas rapido, claro y orientado al trabajo diario. Esta fase agrupa mejoras de UX detectadas despues de usar el panel completo.

#### Fase 4.4.1 - Limpieza de header y filtros persistentes

Estado:

- Cerrada. Se saco el buscador global del header y se persisten los filtros operativos existentes por pantalla.

Alcance:

- Guardar filtros por pantalla mientras el admin navega. Implementado para pantallas con filtros ya existentes.
- Persistir filtros operativos en:
  - Turnos. Implementado: fechas, estado, cliente, profesional y pagina.
  - Agenda. Implementado: servicio, profesional y semana.
  - Horarios. Implementado: profesional seleccionado.
  - Clientes. Sin filtros implementados todavia; la busqueda contextual queda para 4.4.6.
  - Servicios. Sin filtros implementados todavia; ordenamiento/listado queda para 4.4.6.
  - Profesionales. Sin filtros implementados todavia; ordenamiento/listado queda para 4.4.6.
  - Bloqueos. Sin filtros implementados todavia; ordenamiento/listado queda para 4.4.6.
- Sacar el buscador global del header porque hoy no aporta valor claro y puede confundir. Implementado.
- Mantener busquedas solo cuando sean contextuales por pantalla.

Salida esperada:

- El admin no pierde contexto al moverse entre pantallas.
- El header queda mas limpio.

#### Fase 4.4.2 - Estados vacios accionables

Estado: cerrada.

Alcance:

- Reemplazar estados vacios genericos por mensajes con siguiente accion.
- Ejemplos:
  - Sin servicios: boton `Crear servicio`. Implementado.
  - Sin profesionales: boton `Crear profesional`. Implementado.
  - Sin clientes: boton `Crear cliente`. Implementado.
  - Sin horarios para profesional: boton `Crear horario`. Implementado.
  - Sin disponibilidad: sugerir revisar horarios, bloqueos o relacion profesional-servicio. Implementado.
  - Sin turnos: sugerir revisar Agenda o crear turno desde disponibilidad. Implementado.

Salida esperada:

- Cuando falta informacion, el admin sabe que hacer sin adivinar. Implementado.

#### Fase 4.4.3 - Crear cliente desde creacion de turno admin

Estado: cerrada.

Alcance:

- En el modal de crear turno desde Agenda, agregar opcion `Nuevo cliente`. Implementado.
- Al elegir esa opcion, mostrar el formulario de creacion de cliente dentro del mismo flujo. Implementado.
- Despues de crear el cliente:
  - seleccionarlo automaticamente. Implementado dentro del flujo de creacion.
  - continuar con la creacion del turno. Implementado: crea cliente y turno en una sola accion.
- Reutilizar validaciones actuales de cliente. Implementado.
- Mostrar feedback si el cliente se crea correctamente. Implementado con toast `Cliente y turno creados`.

Salida esperada:

- Si alguien llama o escribe y todavia no existe como cliente, el admin puede cargarlo sin salir de Agenda. Implementado.

#### Fase 4.4.4 - Dashboard mas operativo

Estado: cerrada.

Alcance:

- Hacer que las cards del dashboard sean navegables. Implementado.
- Ejemplos:
  - `Pendientes` abre Turnos filtrado por pendientes. Implementado para semana actual y proxima.
  - `Confirmados` abre turnos confirmados de hoy o de la semana. Implementado para confirmados de hoy.
  - `Completados` abre turnos completados/historial. Implementado para semana actual y proxima.
  - `Proximo turno` abre detalle del turno. Implementado como acceso a Turnos filtrado por cliente, estado y fecha hasta que exista modal de detalle en 4.4.5.
- Revisar que el dashboard funcione como entrada real de trabajo y no solo como resumen. Implementado con links filtrados, acciones rapidas y lectura de parametros URL en Turnos.

Salida esperada:

- El dashboard permite actuar rapidamente sobre lo mas importante del dia. Implementado.

#### Fase 4.4.5 - Rediseno de Turnos y detalle operativo

Estado: cerrada.

Alcance:

- Revisar visualmente la seccion Turnos porque hoy no termina de convencer como herramienta diaria. Implementado.
- Explorar una estructura por pestañas o segmentos:
  - `Pendientes`. Implementado.
  - `Confirmados`. Implementado.
  - `Cerrados`. Implementado como accesos operativos a completados/cancelados desde filtros rápidos.
  - `Todos`. Implementado.
- Mejorar el listado por dia para lectura rapida. Implementado reduciendo acciones inline y dejando un acceso `Ver detalle`.
- Abrir un modal de detalle al tocar un turno. Implementado.
- El modal debe mostrar toda la informacion del turno:
  - cliente. Implementado.
  - profesional. Implementado.
  - servicio. Implementado.
  - fecha y horario. Implementado.
  - estado. Implementado.
  - notas. Implementado.
  - motivo de rechazo/cancelacion si existe. Implementado.
  - fechas de confirmacion, cancelacion, completado o no-show si existen. Implementado.
- Las acciones del turno deben estar dentro del modal, bien descritas con icono + texto:
  - `Confirmar turno`. Implementado.
  - `Rechazar turno`. Implementado.
  - `Cancelar turno`. Implementado.
  - `Completar turno`. Implementado.
  - `Marcar no asistio`. Implementado.
- Mantener confirmaciones antes de ejecutar cada accion. Implementado.

Salida esperada:

- Turnos se vuelve una vista de operacion clara, con detalle y acciones menos ambiguas. Implementado.

#### Fase 4.4.6 - Busqueda, filtros y ordenamiento en listas

Estado: cerrada.

Alcance:

- Agregar ordenamiento en listados principales. Implementado.
- Prioridad:
  - Clientes: nombre y fecha de alta. Implementado.
  - Servicios: nombre y duracion. Implementado.
  - Profesionales: nombre. Implementado.
  - Turnos: fecha, estado, cliente/profesional. Implementado como orden seleccionable.
  - Horarios: dia y hora de inicio. Implementado.
  - Bloqueos: fecha de inicio y profesional. Implementado.
- En Clientes, agregar buscador contextual por:
  - nombre. Implementado.
  - email. Implementado.
  - telefono si aplica. Implementado.
- En Clientes, agregar filtro/orden de `ultimos clientes creados`. Implementado.
- Mantener la busqueda de clientes dentro de la pestana Clientes, no como busqueda global. Implementado.
- Mostrar claramente el criterio de orden/filtro activo. Implementado con controles visibles por pantalla.

Salida esperada:

- El admin encuentra clientes y entidades rapido sin depender del scroll. Implementado.

#### Fase 4.4.7 - Badges de conflicto/configuracion incompleta

Estado: cerrada.

Alcance:

- Mostrar alertas o badges cuando falte configuracion operativa. Implementado.
- Ejemplos:
  - Profesional sin horarios activos. Implementado en Profesionales y Dashboard.
  - Servicio sin profesionales compatibles. Implementado en Servicios y Dashboard.
  - Profesional sin servicios asignados si esta en modo especifico.
  - Cliente sin turnos.
  - Servicio inactivo.
  - Profesional inactivo.
- Usar estos indicadores en dashboard y listados donde sumen claridad. Implementado para alertas que afectan disponibilidad.

Salida esperada:

- El panel ayuda a detectar problemas de configuracion antes de que afecten la agenda. Implementado.

#### Fase 4.4.8 - Menu de acciones en mobile y listados

Estado: cerrada.

Alcance:

- Reemplazar grupos de iconos sueltos por un menu de acciones cuando haya varias acciones. Implementado.
- Cada accion debe mostrar icono + texto. Implementado.
- Acciones esperadas segun pantalla:
  - Editar. Implementado.
  - Desactivar. Implementado.
  - Reactivar. Implementado.
  - Ver historial. Implementado en Clientes.
  - Ver detalle. Ya implementado en Turnos con boton claro.
  - Confirmar. Ya implementado en detalle de Turnos con icono + texto.
  - Cancelar. Ya implementado en detalle de Turnos con icono + texto.
- Priorizar mobile, pero evaluar si tambien mejora desktop. Implementado en mobile y desktop para consistencia.

Salida esperada:

- Las acciones son mas faciles de entender y se reducen toques accidentales. Implementado.

Orden recomendado:

1. Fase 4.4.1, porque limpia header y sienta base de filtros.
2. Fase 4.4.2, porque mejora todas las pantallas sin cambiar reglas de negocio.
3. Fase 4.4.3, porque mejora mucho el flujo real de mostrador al crear turnos.
4. Fase 4.4.4, porque convierte el dashboard en entrada operativa.
5. Fase 4.4.5, porque Turnos necesita una decision visual mas grande.
6. Fase 4.4.6, porque busqueda/ordenamiento vuelve mas escalable el admin.
7. Fase 4.4.7, porque agrega inteligencia operativa sobre la configuracion.
8. Fase 4.4.8, porque pule la interaccion y especialmente mobile.

### Fase 4.5 - Correcciones UX post-prueba del admin

Objetivo:

Resolver problemas detectados al usar el panel admin como flujo real, antes de pasar al flujo cliente. Esta fase prioriza claridad, prevencion de acciones accidentales y consistencia de filtros/modales.

#### Fase 4.5.1 - Seguridad de sesion y confirmaciones

Problemas detectados:

- El boton `Cerrar sesion` no pide confirmacion.

Recomendacion:

- Agregar modal de confirmacion antes de cerrar sesion. Implementado.
- Texto sugerido: `Vas a cerrar la sesion actual.` Implementado.
- Mantener botones claros: `Volver` y `Cerrar sesion`. Implementado.

Salida esperada:

- Se evitan cierres accidentales de sesion. Implementado.

#### Fase 4.5.2 - Busquedas, campos y limpieza visual

Problemas detectados:

- Profesionales y Servicios tambien deberian tener buscador.
- Se solapa la lupita del buscador con el placeholder/texto.
- Hay que ordenar mejor los campos cuando se crea turno desde Agenda con opcion `Nuevo cliente`.

Estado actual:

- Servicios y Profesionales ya tienen buscador en 4.4.6, con revision visual fina implementada.

Recomendacion:

- Revisar padding interno de inputs con icono para que la lupa no pise texto. Implementado.
- Mantener buscadores contextuales en Servicios, Profesionales y Clientes. Implementado.
- En el modal de crear turno desde Agenda, ordenar `Nuevo cliente` como:
  1. Nombre completo. Implementado.
  2. Telefono. Implementado.
  3. Email. Implementado.
  4. Password. Implementado.
  5. Notas del turno. Implementado.
- Mantener el resumen superior del turno visible antes del formulario. Implementado.

Salida esperada:

- Los formularios se leen de forma natural y los buscadores no generan ruido visual. Implementado.

#### Fase 4.5.3 - Turnos: filtros, rangos y orden

Estado: cerrada.

Problemas detectados:

- El boton del dashboard para ver todos los turnos no reinicia el filtro de estado. Corregido con `status=ALL`.
- No queda claro que hace `Ver turnos de la ventana`. Corregido: ahora dice `Ver semana actual y proxima`.
- El filtro/orden en Turnos no funciona correctamente. Corregido: se retiro el selector de orden por ahora y Turnos queda ordenado por fecha ascendente.
- No queda claro el boton para reiniciar filtros en Turnos. Corregido con botones de rango y `Limpiar filtros`.
- Deberian existir tres botones claros:
  - `Semana actual + proxima`. Implementado.
  - `Semana actual`. Implementado.
  - `Proxima semana`. Implementado.

Recomendacion:

- Reemplazar `Ver turnos de la ventana` por un texto mas explicito, por ejemplo `Ver semana actual y proxima`. Implementado.
- Cuando el Dashboard abre `Total ventana`, enviar explicitamente `status=` vacio o hacer que Turnos limpie estado al no recibir `status`. Implementado con `status=ALL`.
- En Turnos, separar controles:
  - Grupo de rango rapido: `Semana actual`, `Proxima semana`, `Semana actual + proxima`. Implementado.
  - Boton secundario: `Limpiar filtros`. Implementado.
  - Selector de orden visible y validado. Retirado por decision UX: no aporta al MVP actual.
- Verificar si el backend soporta todos los `sort` usados. Si un sort no es confiable, hacer orden local o limitar opciones. Retirado del alcance actual; queda como mejora futura.

Salida esperada:

- Turnos permite cambiar rango y filtros sin estados viejos escondidos. El orden queda como mejora futura si vuelve a aportar valor. Implementado.

#### Fase 4.5.4 - Modales encadenados de Turnos

Problemas detectados:

- Cuando desde el detalle de turno se abre una confirmacion y se toca `Volver` o se cierra, tambien se cierra el modal del turno.
- El modal del turno deberia quedar abierto para elegir otra accion.

Recomendacion:

- Mantener `selectedAppointment` abierto cuando se abre una confirmacion.
- Abrir `AdminConfirmDialog` por encima usando `stack="top"`.
- Al confirmar exitosamente, cerrar confirmacion y detalle.
- Al cancelar confirmacion, cerrar solo confirmacion y volver al detalle.
- Para rechazo/cancelacion con motivo, usar el mismo criterio: modal de motivo encima del detalle, sin cerrar el detalle al volver.

Salida esperada:

- El admin puede abrir una accion, arrepentirse y seguir viendo el mismo turno. Implementado.

#### Fase 4.5.5 - Menu de acciones unico

Problemas detectados:

- Se pueden abrir varios menus de tres puntos a la vez y la pantalla queda contaminada.

Recomendacion:

- Convertir `AdminActionsMenu` en menu controlado con un identificador abierto global por pantalla o por contexto.
- Alternativa simple: usar un listener global de click/focus y cerrar otros menus al abrir uno nuevo.
- Preferencia: crear hook `useSingleOpenMenu` o usar estado en el componente menu con evento custom para cerrar otros menus.

Salida esperada:

- Solo un menu de acciones queda abierto por vez. Implementado.

Orden recomendado:

1. Fase 4.5.3, porque afecta navegacion central de Turnos y Dashboard.
2. Fase 4.5.4, porque evita perder contexto durante acciones importantes.
3. Fase 4.5.5, porque limpia la interaccion de listados.
4. Fase 4.5.2, porque pule lectura visual y formulario de nuevo cliente.
5. Fase 4.5.1, porque es pequeno pero importante para prevenir errores.

### Fase 5 - Flujo cliente para solicitar turno

Estado: pendiente.

Objetivo:

Permitir que un cliente pida turno con pocos pasos.

#### Fase 5.1 - Estructura base del area cliente

Estado: implementada.

Objetivo:

Definir la primera experiencia del cliente autenticado. Al iniciar sesion, el cliente entra directamente al flujo para pedir turno, pero con una estructura preparada para crecer hacia perfil, proximos turnos y turnos pasados.

Tareas:

- [x] Revisar ruta actual `/app/book` y layout cliente.
- [x] Definir el shell visual del area cliente.
- [x] La primera vista del cliente debe ser la seleccion de servicio para pedir turno.
- [x] Mostrar arriba a la derecha el usuario autenticado.
- [x] Preparar acceso futuro a edicion de perfil o datos personales.
- [x] Preparar navegacion futura para:
  - proximos turnos
  - turnos pasados
  - perfil
- [x] Definir copy y estructura visual inicial del flujo de reserva.
- [x] Mostrar estado vacio cuando todavia no hay servicio seleccionado.
- [x] Cargar servicios activos disponibles para reserva.
- [x] Evitar mostrar servicios inactivos.
- [x] Agregar estados de carga y error.

Salida esperada:

- El cliente entra a un area propia clara, orientada primero a pedir turno, pero preparada para incorporar historial, proximos turnos y perfil.

#### Fase 5.2 - Seleccion de servicio y profesional

Estado: implementada.

Objetivo:

Permitir que el cliente elija primero el servicio y despues el profesional compatible, manteniendo la relacion profesional-servicio.

Tareas:

- [x] Selector de servicio como primer paso.
- [x] Al elegir servicio, cargar profesionales que realizan ese servicio.
- [x] Si hay un solo profesional compatible, permitir preseleccion o seleccion simple.
- [x] Si hay varios profesionales, mostrar selector claro.
- [x] Si no hay profesionales compatibles, mostrar mensaje accionable.
- [x] No avanzar a disponibilidad sin servicio y profesional seleccionados.

Salida esperada:

- El cliente selecciona una combinacion valida de servicio y profesional.

#### Fase 5.3 - Disponibilidad por semana

Estado: implementada.

Objetivo:

Mostrar disponibilidad de turnos de forma simple, usando semanas navegables y slots claros.

Tareas:

- [x] Mostrar semana actual por defecto.
- [x] Agregar selector de semana con flecha anterior y siguiente.
- [x] Mostrar rango visible de 7 dias.
- [x] Limitar inicialmente a semana actual y semana siguiente, salvo decision posterior.
- [x] Consultar disponibilidad segun servicio, profesional y semana.
- [x] En desktop, mostrar dias en columnas con horarios disponibles.
- [x] En mobile, mostrar dias como secciones verticales.
- [x] Mostrar mensaje si no hay horarios disponibles.

Salida esperada:

- El cliente ve horarios disponibles de forma clara y responsive.

#### Fase 5.4 - Confirmacion de solicitud

Estado: implementada.

Objetivo:

Crear una solicitud de turno `PENDING` con una confirmacion entendible antes de enviarla.

Tareas:

- [x] Permitir seleccionar un horario disponible.
- [x] Mostrar resumen antes de confirmar:
  - servicio
  - profesional
  - fecha
  - horario
- [x] Agregar campo opcional de notas si el backend lo permite.
- [x] Confirmar solicitud contra backend.
- [x] Bloquear doble envio mientras se procesa.
- [x] Mostrar feedback de exito o error.

Salida esperada:

- El cliente puede solicitar un turno que queda como `PENDING`.

#### Fase 5.5 - Resultado y continuidad

Estado: implementada.

Objetivo:

Cerrar el flujo con una pantalla clara y conectar con el area cliente.

Tareas:

- [x] Pantalla de resultado despues de solicitar turno.
- [x] Explicar que el turno queda pendiente de confirmacion.
- [x] Boton para ver `Mis turnos`.
- [x] Boton para solicitar otro turno.
- [x] Revisar que el admin vea la solicitud pendiente.
- [x] Probar flujo completo cliente -> admin.

Salida esperada:

- El cliente entiende que pidio un turno y puede seguir navegando sin perder contexto.

Salida esperada:

- El cliente puede crear un turno `PENDING`.

### Fase 6 - Area cliente

Estado: iniciada.

Objetivo:

Completar la experiencia minima del cliente despues de que ya existe el flujo para pedir turno. La idea es que el cliente no solo pueda solicitar un turno, sino tambien entender su estado, revisar su historial, cancelar cuando corresponda y tener una zona de perfil clara.

#### Fase 6.1 - Pulido de Mis turnos

Estado: implementada.

Objetivo:

Mejorar la pantalla `/app/appointments` para que el cliente pueda leer rapidamente que turnos tiene pendientes, confirmados o historicos.

Tareas:

- [x] Mejorar jerarquia visual de la pantalla `Mis turnos`.
- [x] Separar proximos turnos, pendientes, confirmados e historial de forma clara.
- [x] Agregar filtros simples por estado.
- [x] Mostrar mensajes mas especificos segun estado del turno.
- [x] Mantener boton claro para pedir otro turno.
- [x] Revisar responsive de la pantalla.

Salida esperada:

- El cliente entiende el estado de sus turnos sin depender de leer detalles tecnicos.

#### Fase 6.2 - Perfil del cliente

Estado: implementada.

Objetivo:

Reemplazar el placeholder de `/app/profile` por una pantalla real de datos basicos.

Tareas:

- [x] Mostrar nombre y email del usuario.
- [x] Mostrar telefono si el backend lo devuelve.
- [x] Mostrar estado/rol de cuenta de forma simple.
- [x] Preparar estructura para futura edicion de datos personales.
- [x] Agregar mensajes claros sobre cambios que aun dependan del admin o backend.

Salida esperada:

- El cliente tiene una pantalla de perfil coherente aunque la edicion completa quede para una fase posterior.

#### Fase 6.3 - Fixes del flujo de reserva

Estado: implementada.

Objetivo:

Resolver ajustes detectados al probar la Fase 5 en uso real.

Tareas:

- [x] Revisar responsive del selector de servicios, profesionales y horarios.
- [x] Revisar mensajes de error de disponibilidad y creacion de turno.
- [x] Mejorar comportamiento despues de solicitar turno si algo queda confuso.
- [x] Revisar casos sin disponibilidad o sin profesionales compatibles.
- [x] Ajustar textos para que sean mas humanos y menos tecnicos.
- [x] Mover la confirmacion exitosa a una subpagina propia posterior a la solicitud.
- [x] Abrir confirmacion de solicitud en modal al seleccionar un horario.

Salida esperada:

- El flujo de reserva queda mas claro y resistente a casos vacios o errores.

#### Fase 6.4 - Cancelacion de turno por cliente

Estado: implementada.

Objetivo:

Permitir que el cliente cancele turnos propios cuando el backend lo soporte y el estado del turno lo permita.

Tareas:

- [x] Agregar accion de cancelar en turnos cancelables.
- [x] Pedir confirmacion antes de cancelar.
- [x] Agregar motivo si el backend lo requiere o permite.
- [x] Mostrar feedback claro despues de cancelar.
- [x] Actualizar `Mis turnos` sin recargar la pagina.

Salida esperada:

- El cliente puede cancelar sin llamar al admin, pero con confirmacion para evitar errores.

#### Fase 6.5 - Prueba completa cliente-admin

Estado: implementada.

Objetivo:

Verificar el ciclo completo entre cliente y administrador.

Tareas:

- [x] Cliente solicita turno.
- [x] Cliente ve turno pendiente en `Mis turnos`.
- [x] Admin ve solicitud pendiente.
- [x] Admin confirma o rechaza.
- [x] Cliente ve cambio de estado.
- [x] Cliente cancela cuando corresponda.
- [x] Revisar desktop, tablet y mobile.

Salida esperada:

- El circuito cliente-admin queda validado como flujo MVP.

#### Fase 6.6 - Edicion de perfil del cliente

Estado: implementada.

Objetivo:

Permitir que el cliente edite sus datos personales basicos desde `/app/profile`, diferenciando claramente que datos puede cambiar por su cuenta y cuales requieren decision de seguridad o soporte de backend.

Tareas:

- [x] Revisar si el backend ya tiene endpoint para que el cliente edite su propio perfil.
- [x] Si no existe endpoint, definir contrato backend necesario para editar perfil propio.
- [x] Permitir editar nombre completo.
- [x] Permitir editar telefono.
- [x] Definir si el email se puede cambiar desde cliente o queda bloqueado por seguridad.
- [x] Si email queda bloqueado, mostrarlo como dato de cuenta no editable.
- [x] Validar campos antes de enviar.
- [x] Guardar cambios contra backend.
- [x] Mostrar feedback claro de exito o error.
- [x] Refrescar `/api/users/me` despues de guardar para actualizar el header y el perfil.
- [x] Revisar responsive del formulario de edicion.

Salida esperada:

- El cliente puede mantener sus datos basicos actualizados sin depender del admin, siempre que el backend lo permita.

Tareas generales:

- Mis turnos.
- Cancelar turno propio.
- Ver estado del turno.
- Perfil basico.

Salida esperada:

- El cliente puede consultar y administrar sus reservas basicas.

### Fase 7 - Sitio publico

Estado: iniciada.

Objetivo:

Dejar presentable la cara publica del negocio.

Tareas:

- [x] Home del negocio inspirada en el export `estetica (Community)`.
- [x] Definicion estetica inicial para BIBE en espanol.
- [x] Hero publico con imagen, mensaje claro y CTA.
- [x] Seccion de tratamientos organizada por categorias.
- [x] Navbar simplificada con tratamientos agrupados.
- [x] Seccion destacada de recuperacion capilar.
- [x] Seccion `Por que elegir BIBE`.
- [x] Seccion de resultados/confianza.
- [x] CTA final a contacto/WhatsApp.
- [x] Footer simple.
- [x] Detalle publico de servicios por categoria con estructura inicial.
- [x] CTA para pedir turno.
- [x] Contacto base.
- [x] Ajuste responsive inicial.
- [x] Navegacion desde navbar y home hacia paginas internas de tratamientos.
- [ ] Reemplazar textos e informacion placeholder por contenido real de BIBE.
- [x] Reemplazar placeholders visuales de tratamientos por imagenes reales.
- [ ] Pulido visual final despues de revisar en navegador.

Salida esperada:

- La app tiene una entrada publica coherente con BIBE Estetica.

Estructura publica inicial:

- Inicio/Home.
- Servicios organizados por categorias.
- Paginas internas:
  - `/tratamientos/recuperacion-capilar`.
  - `/tratamientos/estetica-facial`.
  - `/tratamientos/estetica-corporal`.
  - `/tratamientos/pestanas-cejas`.
  - `/tratamientos/podologia`.
- Turno, que lleva a login/registro si el usuario no esta autenticado.
- Contacto.

### Fase 8 - Pulido y calidad

Objetivo:

Cerrar MVP frontend con estabilidad.

Tareas:

- Revisar responsive.
- Revisar posibles mejoras UX anotadas en la seccion 3.2 y decidir cuales entran al MVP.
- Revisar errores y estados vacios.
- Revisar accesibilidad basica.
- Revisar consistencia visual.
- Agregar tests donde tenga sentido.
- Documentar setup.
- Probar flujo completo con backend local.

Salida esperada:

- Frontend usable para demo y desarrollo posterior.

## 8. Estructura de carpetas sugerida

```text
src
|-- app
|   |-- router
|   |-- providers
|   |-- layouts
|-- features
|   |-- auth
|   |-- public-site
|   |-- client
|   |-- admin
|   |-- services
|   |-- professionals
|   |-- business-hours
|   |-- availability-blocks
|   |-- appointments
|-- shared
|   |-- api
|   |-- components
|   |-- hooks
|   |-- utils
|   |-- types
|-- styles
```

Regla:

Agrupar por feature para que el proyecto no se convierta en una carpeta gigante de componentes sueltos.

## 9. Decisiones tomadas provisionalmente

- El frontend tendra tres superficies: publico, cliente y admin.
- React + TypeScript sera la base del frontend.
- TailAdmin sera referencia principal o posible base visual del panel admin.
- El panel admin debera contemplar modo dark y light.
- El panel admin vivira en `/admin`.
- No habra boton publico visible hacia admin en la home.
- Login y registro tendran rutas propias.
- El login redirige segun rol.
- El registro deja al cliente logueado automaticamente si recibe token.
- Las rutas protegidas redirigen estrictamente segun rol.
- El admin sera la primera prioridad fuerte del frontend.
- El primer objetivo funcional sera el panel admin.
- El admin podra gestionar clientes desde el primer MVP.
- El cliente solicitara turnos que nacen como `PENDING`.
- El visitante podra ver servicios publicos, pero no disponibilidad.
- La solicitud de turno requiere usuario autenticado.
- El sistema sugerira/asignara profesional en el MVP.
- La seleccion manual de profesional queda como mejora futura.
- La vista de turnos sera agenda/listado, no calendario complejo al inicio.
- El admin y el cliente trabajaran inicialmente con semana actual y semana siguiente.
- Los servicios seran principalmente texto en el MVP.
- El sitio publico tendra Inicio/Home, Servicios, Turno y Contacto.
- El estilo visual buscado sera premium y calido.
- El sitio publico sera simple al inicio.
- El frontend sera parte del proyecto fullstack, separado del backend.

## 10. Decisiones pendientes

Estas decisiones se iran cerrando a medida que aparezcan ideas nuevas.

- Nombre visual definitivo del negocio en la UI: `BIBE Estetica`, `BIBE`, u otro.
- Definicion fina del estilo visual premium y calido.
- Definir si TailAdmin se integra como plantilla base o se replica visualmente con componentes propios.
- Definir stack de estilos concreto segun lo que requiera TailAdmin y el proyecto.
- Si los servicios publicos tendran imagenes en una fase posterior.
- Si el sitio publico necesita secciones de promociones, equipo, ubicacion o galeria mas adelante.
- Como sera exactamente el criterio visual antes de la fase de diseno: paleta, tipografias, referencias y tono.
- En el flujo de turnos, definir si la seleccion de fecha muestra solo dias disponibles o si muestra todos los dias con indicadores de disponibilidad.

## 11. Riesgos y criterios de juicio

### Riesgo: empezar por la home y postergar la operacion

Puede dar una app linda pero poco util. El backend ya resuelve reglas operativas; conviene exponerlas primero en admin.

### Riesgo: mezclar cliente y admin en una sola interfaz

Puede volver confusa la navegacion. Mejor separar por rutas y layouts.

### Riesgo: hacer el calendario demasiado complejo al principio

Un calendario completo semanal es atractivo, pero puede demorar. Para MVP se empezara con agenda/listado de turnos y una ventana visible de semana actual y semana siguiente.

### Riesgo: esconder demasiado el admin

No hace falta boton publico, pero `/admin` y redireccion por rol deben ser claros. El admin no deberia depender de recordar URLs raras.

### Riesgo: pedir registro demasiado temprano

Si se fuerza login antes de ver cualquier cosa, puede bajar conversion. La decision tomada equilibra esto: el visitante puede ver informacion y servicios, pero disponibilidad y reserva quedan detras de autenticacion.

### Riesgo: usar una plantilla admin sin adaptarla

TailAdmin puede acelerar el inicio, pero si se copia sin criterio puede imponer estructura, estilos o componentes que despues dificulten formularios, permisos o flujos propios. Debe evaluarse antes de adoptarse.

## 12. Orden recomendado de trabajo inmediato

1. Evaluar integracion tecnica de TailAdmin con React + TypeScript.
2. Crear proyecto frontend.
3. Configurar router y layouts.
4. Implementar login contra backend.
5. Implementar proteccion por rol.
6. Construir shell de `/admin`.
7. Implementar servicios admin.
8. Implementar profesionales admin.
9. Implementar gestion de clientes admin.
10. Implementar horarios y bloqueos.
11. Implementar turnos admin como listado/agenda.
12. Cerrar Fase 4.1 con disponibilidad admin, acciones rapidas y placeholders administrativos resueltos.
13. Implementar flujo cliente autenticado.
14. Pulir sitio publico.
15. Pausar antes de la fase visual fina para definir estetica.

## 13. Preguntas para la siguiente conversacion

- TailAdmin se puede integrar como base real o conviene replicarlo visualmente con componentes propios?
- Que ajustes necesita TailAdmin para sentirse premium/calido y no generico?
- Para la primera fase admin, arrancamos por servicios/profesionales y despues clientes?
- Que datos exactos deberia poder editar el admin en clientes?
- Como deberia sugerirse/asignarse profesional cuando hay mas de uno disponible?
