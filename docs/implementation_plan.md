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

## Open Questions & Product Strategy

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

## Estrategia de Funcionalidades Inspirada en TurnoFácil

Para estructurar la aplicación pensando en un modelo **Freemium (Free vs Pro)**, incorporaremos los siguientes pilares de manera transversal durante las fases de desarrollo:

### A. Reserva sin Fricciones (Fase 2 y 3)
- **Wizard Público:** Los clientes podrán reservar turnos sin iniciar sesión/registrarse previamente. Realizarán la selección completa de servicio, profesional y horario de forma anónima.
- **Formulario Final de Contacto:** En el último paso se solicitará: Nombre, Teléfono y Email.
- **Creación en Segundo Plano:** El backend creará/asociará automáticamente un registro de cliente silencioso para ese negocio.
- **Enlace Único de Turno (Tokenizado):** El cliente recibe un enlace único para visualizar o cancelar su turno sin necesidad de crear contraseñas.

### B. Diferenciación de Planes (Free vs Pro)
- **Modelo de Límites:**
  - `Plan Free`: Permitirá gestionar 1 sola empresa/negocio.
  - `Plan Pro`: Permitirá empresas ilimitadas en una misma cuenta de administración.
- **Monetización (MercadoPago):**
  - La base de datos incluirá campos de configuración de pasarela de pago (`mp_client_id`, `mp_client_secret` o `mp_access_token`).
  - Solo los negocios en `Plan Pro` tendrán acceso a activar cobro total o cobro de seña obligatorio al reservar.
- **Marca Propia:**
  - El frontend cargará un indicador de `powered_by` para inquilinos en el plan Free, y lo ocultará en el plan Pro.

---

## Proposed Changes

La implementación se dividirá en tres etapas consecutivas para mantener la estabilidad del sistema:

1.  **Backend & Database:** Definir la entidad `Business`, migrar la base de datos y filtrar datos.
2.  **Authentication & Security:** Ajustar JWT, control de acceso y endpoint público de turnos.
3.  **Frontend Adaptations:** Ajustar rutas, diseño dinámico y aislamiento visual.

---

### 1. Database & Migrations (Backend)

Modificación de la base de datos para introducir el aislamiento y soporte de planes / MercadoPago.

#### [NEW] [V6__add_business_and_tenant_isolation.sql](file:///c:/Users/vale-/CodeProjects/Freelance/TurnoFacil/backend/Appointment-Manager-API/src/main/resources/db/migration/V6__add_business_and_tenant_isolation.sql)
- Crear la tabla `business` con campos como `id`, `name`, `slug` (VARCHAR UNIQUE), `timezone` (VARCHAR, ej. 'America/Argentina/Buenos_Aires'), `whatsapp`, `primary_color`, `theme_preset`, `booking_enabled`, `plan_type` (FREE, PRO), `mp_access_token`, `show_branding` (boolean), `active` (boolean), y fechas de creación.
- Modificar la tabla `appointments` para agregar `public_uuid` (UUID UNIQUE) que sirva como token de acceso público para invitados, garantizando seguridad contra adivinación de IDs.
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

Adaptar el código Java para filtrar automáticamente todas las consultas operativas por el negocio del usuario autenticado y habilitar la reserva pública.

#### [MODIFY] [User.java](file:///c:/Users/vale-/CodeProjects/Freelance/TurnoFacil/backend/Appointment-Manager-API/src/main/java/com/turnos/api/users/User.java)
- Añadir la relación `@ManyToOne` con la entidad `Business`.

#### [MODIFY] Repositorios de Spring Data JPA
Para cada repositorio relevante (ej. `AppointmentRepository`, `ServiceRepository`, `ProfessionalRepository`):
- Modificar los métodos de consulta para que incluyan el parámetro `Long businessId` o `UUID businessId`.
- Alternativamente, configurar filtros Hibernate `@FilterDef` y `@Filter` para aplicar automáticamente `business_id = :businessId` en todas las lecturas a nivel de sesión.

#### [MODIFY] Lógica de Autenticación y Security
- Actualizar `com.turnos.api.config.SecurityConfig` y los filtros JWT para decodificar el `businessId` del usuario autenticado a partir del Token JWT.
- Permitir acceso anónimo (público) al endpoint de reserva de turnos (`POST /api/public/appointments`).
- Exponer el `businessId` en el objeto `UserDetails` personalizado (ej. `AuthenticatedUser`).

---

### 3. Frontend & routing

Reestructurar el frontend para resolver el inquilino a partir de la URL, aplicar estilos de marca personalizados y soportar la reserva de invitados.

#### [MODIFY] [router.tsx](file:///c:/Users/vale-/CodeProjects/Freelance/TurnoFacil/frontend/src/app/router/router.tsx)
- Reorganizar las rutas públicas, de cliente y administración para que cuelguen de un Layout con parámetro dinámico: `/n/:businessSlug`.

#### [MODIFY] [BusinessProvider.tsx](file:///c:/Users/vale-/CodeProjects/Freelance/TurnoFacil/frontend/src/app/providers/BusinessProvider.tsx)
- Adaptar para leer los colores hexadecimales configurados del negocio (ej. `primaryColor`) del backend y aplicarlos dinámicamente usando variables CSS (`--primary-color`) en el elemento raíz `:root`.
- Los colores derivados (hover, fondos de badges, bordes, estados activos) se calcularán automáticamente en la hoja de estilos global utilizando la función nativa de CSS `color-mix()`.
- Agregar un selector de color hexadecimal nativo (`<input type="color" />`) en el formulario de configuración del negocio en el panel de administración (remover la casilla de 'showBranding' de este panel, ya que pertenecerá exclusivamente a la consola de SuperAdmin).

#### [MODIFY] [httpClient.ts](file:///c:/Users/vale-/CodeProjects/Freelance/TurnoFacil/frontend/src/shared/api/httpClient.ts)
- Incluir un encabezado HTTP personalizado (ej. `X-Business-Slug` o `X-Business-ID`) en todas las peticiones al backend si el usuario no está autenticado, para que el backend sepa a qué negocio corresponde la consulta (por ejemplo, para cargar la lista de servicios en la landing de reservas).

---

### 3.1. Fase 4.1: Rediseño Visual Genérico y Maquetación de Secciones (Landing Page Paramétrica)

Para elevar la calidad visual de la landing page pública y hacerla ver sumamente premium para cualquier rubro, reestructuraremos el layout en 6 secciones principales con reglas de diseño bien definidas:

#### A. Portada Hero (Hero Section)
*   **Diseño Visual:** Estructura asimétrica moderna de dos columnas.
    *   *Columna Izquierda:* Eslogan comercial dinámico, descripción corta del negocio y un botón de CTA destacado ("Reservar Turno") y botón secundario ("Ver Catálogo") usando variables CSS `--primary` y su hover calculado.
    *   *Columna Derecha:* Un componente de tipo **Glassmorphic Quick Booking Card** (tarjeta de vidrio esmerilado que flota sobre círculos difuminados de color de fondo) que invite al usuario a agendar inmediatamente, mostrando el nombre y slug del negocio actual de forma interactiva.
*   **Fondo:** Un fondo con gradientes fluidos (mezclando el color `--primary` con transparencia) para dar profundidad moderna sin sobrecargar.

#### B. Catálogo de Servicios Simple y Organizado (Services Cards Grid)
*   **Diseño Visual:** Cuadrícula responsiva de tarjetas minimalistas. Para evitar interactividad innecesaria (tabs/clicks), los servicios se listarán todos directamente en la página.
*   **Organización:** Opcionalmente se agruparán bajo títulos de texto limpios y elegantes según su categoría (ej. *"Estética Facial"*, *"Corte y Estilo"*), facilitando la lectura sin requerir solapas interactivas complejas.
*   **Contenido de Tarjetas:**
    *   Alineación limpia de textos.
    *   Badge destacado con la duración en minutos (ej: `45 min`).
    *   Precio destacado en negrita con el color primario (`var(--primary)`).
    *   Descripción del servicio con límite de líneas para evitar asimetrías.
    *   Botón "Agendar" de acción directa que eleva la tarjeta con una sombra suave (`box-shadow`) al hacer hover (efecto de elevación/lift).

#### D. Nuestro Equipo (Staff/Professionals Section)
*   **Diseño Visual:** Mosaico de avatares estilizados.
*   **Avatares:** Círculos perfectos usando las iniciales del profesional con tipografía destacada y fondo en contraste de color de marca.
*   **Interactividad:** Cada tarjeta de profesional incluirá un enlace rápido que redirigirá al asistente de reserva (`/book`) pre-seleccionando a dicho profesional, lo que agiliza el flujo del cliente.

#### E. Horarios de Atención y Contacto (Business Hours & Contact)
*   **Diseño Visual:** Secciones laterales bien delimitadas en un layout balanceado.
    *   *Izquierda:* Tabla minimalista de horarios semanales con indicador destacado del día de hoy en color corporativo si el negocio está abierto.
    *   *Derecha:* Tarjeta de contacto que incluye botón directo de redirección a WhatsApp Web configurado con el teléfono real del negocio (`https://wa.me/{numero}`).

#### F. Powered by TurnoFácil (SaaS Branding)
*   **Lógica de Renderizado:** Este banner se mostrará en el footer exclusivamente si `showBranding` es verdadero. El administrador del negocio no tendrá control para desactivarlo.
*   **Ubicación:** Un bloque discreto y elegante en el borde inferior del footer.

---


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
