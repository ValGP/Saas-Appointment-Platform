# SaaS Appointment Platform - Multi-Tenant Booking System

**SaaS Appointment Platform** is a full-stack, multi-tenant Software-as-a-Service (SaaS) application designed for dynamic scheduling and real-time availability management.

The system allows multiple independent businesses (tenants) to run on a shared infrastructure with complete logical data isolation. Each business can manage its service catalog, set weekly schedules for professionals, configure custom availability blocks, and provide customers with personalized booking portals using their own visual theme and passwordless secure checkout links.

The project originated as a dedicated booking engine for **BIBE Estética** and is currently transitioning and scaling into a generic multi-tenant SaaS.

---

## 🚀 Architecture and Tenant Isolation

The platform is designed around a **Single Database, Shared Schema** model using a `business_id` discriminator column across all operational tables.

Incoming API requests are dynamically resolved and isolated through the following layers:
1. **Frontend Routing:** All surfaces are nested under a dynamic slug prefix: `/n/:businessSlug` (e.g., `/n/bibe-estetica`). The frontend includes the custom `X-Business-Slug` header in HTTP requests to communicate the active tenant.
2. **Tenant Filter ([TenantFilter](file:///c:/Users/vale-/CodeProjects/Freelance/TurnoFacil/backend/Appointment-Manager-API/src/main/java/com/turnos/api/business/TenantFilter.java)):** A servlet filter intercepts incoming HTTP requests, resolves the business by its slug header or session context, and sets the active tenant context.
3. **Tenant Context ([TenantContext](file:///c:/Users/vale-/CodeProjects/Freelance/TurnoFacil/backend/Appointment-Manager-API/src/main/java/com/turnos/api/business/TenantContext.java)):** Uses `ThreadLocal` to store the active business during the request lifecycle. This ensures JPA repositories only fetch data belonging to the resolved tenant.

---

## 🎨 Surfaces per Tenant

The application exposes three major areas scoped per tenant (`/n/:businessSlug`):

1. **Public Landing Site (`/n/:businessSlug`):**
   * Dynamic services catalog grouped by custom categories.
   * Business information, FAQs, and WhatsApp buttons with micro-animations.
   * Dynamic theme styling loaded at runtime based on the tenant's visual configuration (e.g., Aesthetic Pink, Health Blue, Premium Black).

2. **Client Booking Portal (`/n/:businessSlug/app/*`):**
   * Intuitive 4-step booking wizard: **Category → Service → Professional → Live Available Slots**.
   * **Zero-Friction Checkout:** Customers can book slots without creating an account or typing a password. The system generates a silent guest record and returns a tokenized secure link with a public UUID (`public_uuid`) for viewing or canceling appointments.
   * Personal client dashboard for registered users showing pending requests, confirmed bookings, and appointment history.

3. **Administration Dashboard (`/n/:businessSlug/admin/*`):**
   * **Operational Dashboard:** Real-time metrics of daily activity (pending, confirmed, and completed) and configuration alerts (e.g., professionals without schedules, services without assigned professionals).
   * **Weekly Agenda Grid:** Interactive calendar showing availability per professional. Admins can schedule or confirm appointments on behalf of new or existing clients with a single click.
   * **Catalog Management (CRUD with logical deletion):** Full control over services, categories, professionals, weekly working blocks, and agenda blocks (holidays, vacations).
   * **Customer Database:** Searchable customer index with history modals.

---

## ⚡ Real-Time Availability Engine

The core scheduling logic resolves slot availability dynamically:
* **On-the-Fly Calculations:** Available slots are not stored in the database. Instead, they are calculated in real time by crossing the professional's weekly working hours, active agenda blocks (vacations), existing appointments (`PENDING` and `CONFIRMED` statuses), and the duration of the requested service.
* **Collision Prevention:** The system blocks scheduling conflicts for the same professional and strictly enforces service compatibility checks.
* **Data Integrity:** Services, categories, and professionals utilize logical deletion (`active = false`) to preserve past transactional booking data.

---

## 🛠️ Technology Stack

### Backend (Java/Spring Boot)
* **Java 17/21** and **Spring Boot 3.3.5**.
* **Spring Security & JWT** for role-based authentication (`CLIENT` and `ADMIN` roles).
* **Spring Data JPA & Hibernate** for persistence and relational mapping.
* **Flyway** for database migrations.
* **PostgreSQL** as the primary production database.
* **H2 Database** in-memory for unit and integration testing.
* **SpringDoc OpenAPI (Swagger)** for API specification.

### Frontend (React/Vite)
* **React 19** and **TypeScript**.
* **Vite** for fast bundling and hot module replacement.
* **React Router 7** for dynamic and guarded client routing.
* **TanStack Query 5 (React Query)** for server state synchronization and caching.
* **React Hook Form & Zod** for robust client-side validation.
* **Vanilla CSS (Custom CSS)** for lightweight, responsive styles, transitions, and dark/light modes.

---

## 📈 Future SaaS Roadmap & Strategy

The system is architected to transition into a commercial subscription-based platform:
* **Free Plan:**
  * Limited to 1 active business/location.
  * "Powered by [APP NAME]" branding visible on the booking checkout.
* **Pro Plan:**
  * Multi-business administration from a single user dashboard.
  * White-label booking flow (hides platform branding).
  * **Payment Integration (MercadoPago):** Tenants can input their API credentials to require full or partial deposits during the guest booking flow.

---

## ⚙️ Local Setup Guide

### Prerequisites
* **Java 17 or 21** installed.
* **Node.js** (v18 or higher).
* **PostgreSQL** running locally with a database named `appointment_management`.

### 1. Run the Backend
1. Navigate to the backend project:
   ```bash
   cd backend/Appointment-Manager-API
   ```
2. Configure database credentials in [application-dev.yml](file:///c:/Users/vale-/CodeProjects/Freelance/TurnoFacil/backend/Appointment-Manager-API/src/main/resources/application-dev.yml) if they differ from the defaults.
3. Start the application with the development profile active:
   ```bash
   .\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
   ```
The server will run on `http://localhost:8080` and Swagger docs will be at `http://localhost:8080/swagger-ui.html`. The default tenant (BIBE Estética, ID=1) will be seeded automatically.

*Default Admin Credentials:*
* **Username:** `admin@turnos.local`
* **Password:** `admin1234`

### 2. Run the Frontend
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install node dependencies:
   ```bash
   npm.cmd install
   ```
3. Start the Vite dev server:
   ```bash
   npm.cmd run dev
   ```
The application will be served at `http://localhost:5173`. To access the default tenant, visit `http://localhost:5173/n/bibe`.

---

## 🧪 Testing & Quality Assurance
* **Backend:** Contains a suite of **84 unit and integration tests** validating tenant security isolation, status workflows, and slot calculations. Execute using `.\mvnw.cmd test`.
* **Frontend E2E:** Automated end-to-end tests written in **Playwright and Python** to simulate client bookings and admin operations.
