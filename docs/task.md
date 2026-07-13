# Checklist de Conversión a SaaS Multi-Tenant (TurnoFácil)

## Fase 1: Base de Datos y Modelado en Backend
- [x] Crear archivo de migración Flyway `V6__add_business_and_tenant_isolation.sql`
  - [x] Crear tabla `business` para la información de inquilinos, incluyendo:
    - [x] Campos de marca y configuración (`name`, `slug` [VARCHAR UNIQUE], `timezone`, `whatsapp`, `primary_color`, `theme_preset`, `booking_enabled`, `show_branding`)
    - [x] Campos de monetización y planes (`plan_type` [FREE, PRO], `mp_access_token`)
  - [x] Modificar la tabla `appointments` para agregar la columna `public_uuid` (UUID UNIQUE)
  - [x] Agregar columna `business_id` (FK a `business.id`) a las tablas operativas (`users`, `services`, `service_categories`, `professionals`, `business_hours`, `availability_blocks`, `appointments`)
  - [x] Registrar "BIBE Estética" como el primer inquilino por defecto y asociar los registros existentes a su ID para evitar pérdidas de datos
- [x] Crear la clase de entidad `Business.java` en el backend
- [x] Agregar la relación `@ManyToOne` con `Business` en las entidades correspondientes (`User.java`, `Service.java`, `ServiceCategory.java`, `Professional.java`, `BusinessHours.java`, `AvailabilityBlock.java`, `Appointment.java`)
- [x] Modificar `Appointment.java` para incorporar el campo `publicUuid` y generar un UUID aleatorio al persistir nuevas reservas
- [x] Ejecutar migraciones locales y verificar que las tablas se creen correctamente en la base de datos


## Fase 2: Aislamiento, Seguridad y Endpoint Público en Backend
- [x] Modificar la configuración de seguridad y JWT para decodificar y validar el `businessId`
- [x] Implementar filtro Hibernate/JPA en repositorios para restringir consultas únicamente al `businessId` activo
- [x] Validar a nivel de controlador que los administradores de un negocio no tengan permisos sobre los recursos de otros negocios (HTTP 403 Forbidden)
- [x] Exponer endpoints públicos para obtener los datos de configuración pública del negocio (colores, marca, nombre, etc.) mediante el slug de la URL
- [x] Habilitar reserva anónima:
  - [x] Crear endpoint público `POST /api/public/appointments` para reservar turnos sin autenticación previa
  - [x] Implementar lógica para buscar/crear cliente silencioso en base al email recibido en la reserva y asociar el turno

## Fase 3: Enrutamiento Dinámico en Frontend
- [x] Actualizar `router.tsx` para anidar las superficies pública, de cliente y administración bajo la ruta dinámica `/n/:businessSlug`
- [x] Crear hook `useActiveBusiness` para resolver la información del negocio en base al slug de la URL
- [x] Inyectar el slug en las cabeceras de llamadas al backend (API requests)
- [x] Adaptar layouts de cliente, admin y público para soportar los accesos basados en slug
- [x] Adaptar flujo de reservas para solicitar los datos del cliente invitado en el último paso si no está autenticado

## Fase 4: Personalización Visual y Temas Dinámicos
- [ ] Modificar `ThemeProvider.tsx` para inyectar variables CSS personalizadas (colores institucionales) leídas dinámicamente desde el backend
- [ ] Reemplazar referencias estáticas de marca en landing pages y dashboard para consumir los datos de configuración del negocio (respetar flag `show_branding` para quitar "Powered by TurnoFácil" en Pro)
- [ ] Validar funcionamiento de los diferentes presets de temas (Pink, Blue, Dark, etc.)

## Fase 5: Pruebas y Verificación de Aislamiento
- [ ] Ejecutar suite completa de tests automatizados de backend (`mvnw test`) y corregir fallos debido a la adición de `business_id`
- [ ] Crear un negocio secundario de prueba para comprobar visualmente la carga de servicios independientes
- [ ] Validar flujos de reserva completos y transiciones de estado para ambos inquilinos

