# Transición de Mono-Tenant a SaaS Multi-Tenant (TurnoFácil)

Este plan describe los pasos técnicos y decisiones de diseño necesarios para transformar el sistema actual de gestión de turnos (diseñado para un solo negocio, BIBE Estética) en una plataforma SaaS local multi-inquilino (multi-tenant) robusta y escalable.

---

## User Review Required

> [!IMPORTANT]
> **Modelo de Multi-Tenancy (Base de Datos Única)**
> Se propone utilizar un esquema de **base de datos única con discriminador de inquilinos (`business_id`)** por simplicidad y economía de recursos. Esto significa que todas las tablas operativas (usuarios, turnos, servicios, profesionales, etc.) tendrán una columna `business_id`.
> 
> Si en el futuro se requiriera un aislamiento físico absoluto (bases de datos separadas por cliente), el cambio sería significativamente más complejo. Para un SaaS local de bajo costo, la base de datos compartida es la opción recomendada.

> [!WARNING]
> **Rutas en el Frontend (Estructura de URLs)**
> Para acceder a la reserva de un negocio específico, la estructura de la URL cambiará:
> - **Antes:** `/app` y `/admin` (asumiendo que solo existe BIBE).
> - **Después:** `/n/:business_slug/` (página pública del negocio), `/n/:business_slug/app` (portal de clientes del negocio) y `/n/:business_slug/admin` (panel administrativo del negocio).
> 
> Esto requiere reestructurar el enrutador en `frontend/src/app/router/router.tsx` y ajustar la lógica de resolución del negocio activo en base al parámetro `:business_slug`.

---

## Open Questions

> [!IMPORTANT]
> **1. Registro Autónomo de Negocios (Self-Service) vs. Onboarding Manual**
> ¿Deseas que cualquier usuario pueda registrar un nuevo negocio desde la web (autoservicio), o empezamos con un esquema controlado donde un `SUPER_ADMIN` crea los negocios manualmente desde un panel especial de administración?
> * *Recomendación:* Empezar con Onboarding Manual/Controlado por el `SUPER_ADMIN` para simplificar la primera versión comercial.
>
> **2. Dominio y Subdominios**
> ¿Los negocios accederán únicamente a través de la ruta (`misitio.com/n/nombre-negocio`) o querrás soporte de subdominios (`nombre-negocio.misitio.com`) en la primera etapa?
> * *Recomendación:* Utilizar rutas basadas en slugs (`/n/:slug`) al inicio. Es mucho más sencillo de desplegar en Vercel/Netlify sin configuraciones complejas de DNS wildcard.
>
> **3. Autenticación de Clientes Cross-Tenant**
> Si un cliente se registra en "Negocio A" (ej. peluquería), ¿debería poder usar su mismo usuario y contraseña en "Negocio B" (ej. consultorio), o cada negocio tiene un espacio de usuarios completamente aislado?
> * *Recomendación:* Aislamiento total de usuarios clientes por negocio. Un usuario se registra bajo el contexto de un `business_id` específico, evitando cruces de datos entre competidores.

---

## Proposed Changes

La implementación se dividirá en tres etapas consecutivas para mantener la estabilidad del sistema:

1.  **Backend & Database:** Definir la entidad `Business`, migrar la base de datos y filtrar datos.
2.  **Authentication & Security:** Ajustar JWT y control de acceso.
3.  **Frontend Adaptations:** Ajustar rutas, diseño dinámico y aislamiento visual.

---

### 1. Database & Migrations (Backend)

Modificación de la base de datos para introducir el aislamiento.

#### [NEW] [V6__add_business_and_tenant_isolation.sql](file:///c:/Users/vale-/CodeProjects/Freelance/TurnoFacil/backend/Appointment-Manager-API/src/main/resources/db/migration/V6__add_business_and_tenant_isolation.sql)
- Crear la tabla `business` con campos como `id`, `name`, `slug`, `whatsapp`, `primary_color`, `theme_preset`, `booking_enabled`, `active`, y fechas de creación.
- Agregar la columna `business_id` (FK a `business.id`) a las siguientes tablas:
  - `users`
  - `services`
  - `service_categories`
  - `professionals`
  - `business_hours`
  - `availability_blocks`
  - `appointments`
- Crear un negocio por defecto (BIBE Estética) para migrar los datos existentes sin perder información (baseline migration).

---

### 2. Backend Domain & APIs

Adaptar el código Java para filtrar automáticamente todas las consultas operativas por el negocio del usuario autenticado.

#### [MODIFY] [User.java](file:///c:/Users/vale-/CodeProjects/Freelance/TurnoFacil/backend/Appointment-Manager-API/src/main/java/com/turnos/api/users/User.java)
- Añadir la relación `@ManyToOne` con la entidad `Business`.

#### [MODIFY] Repositorios de Spring Data JPA
Para cada repositorio relevante (ej. `AppointmentRepository`, `ServiceRepository`, `ProfessionalRepository`):
- Modificar los métodos de consulta para que incluyan el parámetro `Long businessId` o `UUID businessId`.
- Alternativamente, configurar filtros Hibernate `@FilterDef` y `@Filter` para aplicar automáticamente `business_id = :businessId` en todas las lecturas a nivel de sesión.

#### [MODIFY] Lógica de Autenticación y Security
- Actualizar `com.turnos.api.config.SecurityConfig` y los filtros JWT para decodificar el `businessId` del usuario autenticado a partir del Token JWT.
- Exponer el `businessId` en el objeto `UserDetails` personalizado (ej. `AuthenticatedUser`).

---

### 3. Frontend & routing

Reestructurar el frontend para resolver el inquilino a partir de la URL y aplicar estilos de marca personalizados.

#### [MODIFY] [router.tsx](file:///c:/Users/vale-/CodeProjects/Freelance/TurnoFacil/frontend/src/app/router/router.tsx)
- Reorganizar las rutas públicas, de cliente y administración para que cuelguen de un Layout con parámetro dinámico: `/n/:businessSlug`.

#### [MODIFY] [ThemeProvider.tsx](file:///c:/Users/vale-/CodeProjects/Freelance/TurnoFacil/frontend/src/app/providers/ThemeProvider.tsx)
- Adaptar para leer los colores configurados del negocio (ej. `primary_color`, `theme_preset`) a través de una llamada a la API del negocio (`/api/public/business/:slug`) y aplicarlos dinámicamente usando variables CSS en el elemento raíz `:root`.

#### [MODIFY] [httpClient.ts](file:///c:/Users/vale-/CodeProjects/Freelance/TurnoFacil/frontend/src/shared/api/httpClient.ts)
- Incluir un encabezado HTTP personalizado (ej. `X-Business-Slug` o `X-Business-ID`) en todas las peticiones al backend si el usuario no está autenticado, para que el backend sepa a qué negocio corresponde la consulta (por ejemplo, para cargar la lista de servicios en la landing de reservas).

---

## Verification Plan

### Automated Tests
- Ejecutar la suite de pruebas del backend:
  ```bash
  cd backend/Appointment-Manager-API
  .\mvnw.cmd test
  ```
- Crear nuevas pruebas unitarias/integración para validar que un usuario de `Business A` recibe un error `403 Forbidden` o `404 Not Found` al intentar acceder a recursos de `Business B`.

### Manual Verification
1. Levantar el backend y frontend localmente.
2. Crear mediante base de datos un segundo negocio ("Peluquería Luz", slug: `peluqueria-luz`).
3. Acceder a `http://localhost:5173/n/bibe` y verificar que se visualizan los servicios de estética.
4. Acceder a `http://localhost:5173/n/peluqueria-luz` y verificar que se visualizan los servicios de la peluquería, con sus respectivos colores institucionales y logo.
5. Iniciar sesión como administrador de `bibe` e intentar modificar un turno de `peluqueria-luz` por API para corroborar el aislamiento de seguridad.
