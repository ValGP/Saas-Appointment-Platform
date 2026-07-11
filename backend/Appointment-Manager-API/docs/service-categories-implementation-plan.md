# Implementacion - Categorias de servicios

Este documento registra el avance para agregar categorias administrables a `Service` y ordenar los flujos donde se seleccionan servicios.

## Objetivo

Evitar que servicios como estetica facial, corporal, pestanas, podologia o recuperacion capilar queden en un listado plano dificil de usar. La seleccion operativa pasa a ser:

```text
Categoria -> Servicio -> Profesional -> Disponibilidad
```

El sitio publico mantiene por ahora el contenido hardcodeado en frontend. Las categorias nuevas ordenan la operacion real de turnos.

## Checklist de implementacion

### Backend

- [x] Crear entidad `ServiceCategory`.
- [x] Crear repositorio de categorias.
- [x] Crear DTOs `ServiceCategoryRequest` y `ServiceCategoryResponse`.
- [x] Crear servicio de aplicacion para CRUD de categorias.
- [x] Crear controller `/api/service-categories`.
- [x] Agregar migracion Flyway con tabla `service_categories`.
- [x] Seed inicial:
  - [x] Sin categoria.
  - [x] Recuperacion capilar.
  - [x] Estetica facial.
  - [x] Estetica corporal.
  - [x] Pestanas y cejas.
  - [x] Podologia.
- [x] Agregar `category_id` a `services`.
- [x] Extender `ServiceRequest` con `categoryId`.
- [x] Extender `ServiceResponse` con datos de categoria.
- [x] Validar categoria activa al crear o editar servicios.
- [x] Agregar filtro `GET /api/services?categoryId=...`.
- [x] Mantener filtro `GET /api/services?professionalId=...`.
- [x] Permitir combinar `categoryId` y `professionalId`.
- [x] Bloquear desactivacion de categorias con servicios activos.

### Frontend admin

- [x] Crear API `serviceCategoriesApi.ts`.
- [x] Gestionar categorias desde `Servicios`.
- [x] Agregar categoria al formulario de servicio.
- [x] Mostrar categoria en el listado de servicios.
- [x] Filtrar servicios por categoria.
- [x] Cambiar agenda admin a `Categoria -> Servicio -> Profesional`.
- [x] Filtrar servicios asignables en profesionales por categoria.
- [x] Mantener asignacion profesional-servicio.

### Frontend cliente

- [x] Cargar categorias activas.
- [x] Cambiar reserva a `Categoria -> Servicio -> Profesional -> Horario`.
- [x] Mostrar solo servicios activos de la categoria elegida.
- [x] Limpiar servicio, profesional y horario al cambiar categoria.
- [x] Mantener disponibilidad y solicitud de turno por `serviceId`.

### Tests y verificacion

- [x] Agregar tests de CRUD basico de categorias.
- [x] Agregar test de permisos para cliente.
- [x] Agregar test de bloqueo al desactivar categoria con servicios activos.
- [x] Agregar test de filtro de servicios por categoria.
- [x] Ejecutar `mvnw.cmd test`.
- [x] Ejecutar `npm run build`.
- [ ] Smoke manual de agenda admin.
- [ ] Smoke manual de reserva cliente.

## Mapa de impacto

### Backend - Servicios y categorias

- `Service`: ahora puede tener una categoria asociada.
- `ServiceRequest`: agrega `categoryId`.
- `ServiceResponse`: devuelve `categoryId`, `categoryName`, `categorySlug`.
- `ServiceCatalogService`: resuelve y valida categoria activa.
- `ServiceController`: acepta filtro `categoryId`.
- `ServiceRepository`: agrega consultas por categoria y control de servicios activos.
- `ServiceCategory`: nueva entidad administrable.
- `ServiceCategoryController`: nuevo CRUD administrativo.
- `ServiceCategoryService`: reglas de categoria, slug unico y bloqueo de desactivacion.
- `V4__add_service_categories.sql`: crea tabla, seed y FK.

### Backend - Turnos, disponibilidad y asignaciones

- `AppointmentService`: sigue usando `serviceId`; no cambia la regla de turnos.
- `AvailabilityService`: sigue usando `serviceId`; no cambia el calculo de slots.
- `ProfessionalServiceAssignmentService`: mantiene compatibilidad profesional-servicio; los filtros pueden combinarse desde `/api/services`.
- `ProfessionalServicesAssignmentResponse`: no cambia contrato; la UI usa `GET /api/services` para ver categoria.

### Frontend admin

- `servicesApi.ts`: agrega campos y filtro `categoryId`.
- `serviceCategoriesApi.ts`: nuevo cliente HTTP.
- `AdminServicesPage`: administra categorias, crea servicios con categoria y filtra listado.
- `AdminCalendarPage`: agrega selector de categoria antes de servicio.
- `AdminProfessionalsPage`: filtra servicios asignables por categoria.
- `AdminDashboardPage`: sigue funcionando con servicios; se puede mejorar luego para agrupar alertas por categoria.

### Frontend cliente

- `ClientBookPage`: agrega paso de categoria antes de servicio.
- La disponibilidad y creacion de turno no cambian: siguen usando `serviceId`, `professionalId` y `startDateTime`.

### Docs y datos publicos

- `frontend/src/features/public-site/data/treatmentContent.ts`: no se conecta al backend en esta etapa.
- Los slugs iniciales del backend coinciden con las categorias publicas para facilitar una integracion futura.
- `README.md` y coleccion Postman deben actualizarse si se usan como contrato manual principal.

## Riesgos y puntos a revisar

- Los servicios existentes quedan bajo `Sin categoria` por migracion/default hasta que el admin los edite.
- No conviene desactivar `Sin categoria` mientras existan servicios activos asociados.
- Si se quiere que el sitio publico refleje automaticamente los servicios reales, hay que planificar una segunda etapa.
- Si el listado de categorias crece mucho, conviene separar `Categorias` como pantalla propia del admin.
