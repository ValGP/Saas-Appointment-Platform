# BIBE Estética - Fullstack Appointment & Availability Management System

This is a **Fullstack** application designed and developed as a live booking and availability management system for **BIBE Estética**. The application features three distinct user surfaces (Public, Client, and Administration) and is built on clean design principles, separation of concerns, and a rich domain model (DDD).

It serves as a stellar portfolio showcase demonstrating the real-world integration of a robust **Spring Boot** backend with a modern, reactive **React + TypeScript** frontend, backed by a comprehensive suite of integration and automated tests.

---

## 🚀 System Architecture & Surfaces

The application is structured around three well-defined operational areas:

1.  **Public Business Site (`/`):**
    *   A modern landing page presenting the core treatment catalog organized by categories (Facial, Body, Hair Recovery, Lashes & Brows, Podiatry).
    *   Interactive FAQs and integrated Call-to-Action (CTA) buttons linking to WhatsApp or directing users to the scheduling portal.
    *   Includes a floating WhatsApp button with smooth hover micro-animations and mobile responsiveness.
2.  **Client Booking Portal (`/app/*`):**
    *   An intuitive 4-step booking wizard: **Category → Service → Compatible Professional → Live Available Slots**.
    *   A personal appointment dashboard grouped into three tabs: *Pending* requests, *Confirmed* bookings, and past *History*.
    *   Allows clients to cancel pending or active appointments by providing a mandatory cancellation reason.
    *   Contact profile editing (Name and Phone) with client-side **Zod** validation, keeping the email address locked for session integrity.
3.  **Administration Dashboard (`/admin/*`):**
    *   **Operational Dashboard:** Real-time metrics of daily activity (Pending, Confirmed, and Completed appointments) linking directly to pre-filtered lists. Includes automatic configuration alerts (e.g., services without compatible professionals, professionals without working hours).
    *   **Interactive Weekly Agenda:** A live weekly availability grid per professional/service allowing receptionists to book a confirmed appointment on a free slot with a single click. It supports assigning the appointment to an existing client or registering a new client from the booking form.
    *   **Catalog Management (Full CRUD with Logical Deletion):**
        *   *Services:* Customize durations (in minutes), pricing, and operational flags (e.g., requires evaluation, online-bookable).
        *   *Categories:* Create and arrange categories. Prevent deactivation if they contain active services.
        *   *Professionals:* Set service assignment mode (all services or a custom selection).
        *   *Working Hours:* Weekly working blocks per professional.
        *   *Agenda Blocks:* Exceptions to working hours (vacations, holidays) that automatically invalidate slots.
    *   **Appointment Status Control:** Detailed modal to transition statuses with confirmation dialogs and mandatory reasons (Confirm, Reject, Cancel, Complete, No Show).
    *   **Client Database:** Searchable customer directory with name/email filters and access to individual appointment history from a modal view.

---

## 🛠️ Technology Stack

### Backend (Appointment-Manager-API)
- **Java 17/21** as the core programming language.
- **Spring Boot 3.3.5** for backend framework infrastructure.
- **Spring Security + JWT** for role-based authentication and authorization (`CLIENT` and `ADMIN` roles).
- **Spring Data JPA + Hibernate** for database persistence and relational queries.
- **PostgreSQL** as the primary production and local development database.
- **H2 Database** in-memory for testing isolation.
- **Flyway** for database migrations and schema version control.
- **SpringDoc OpenAPI (Swagger)** for interactive API documentation.

### Frontend
- **React 19** and **TypeScript** for components and typed logic.
- **Vite** for fast bundling and development server.
- **React Router 7** for SPA client-side routing and role-guarded routes.
- **TanStack Query 5 (React Query)** for server state synchronization and caching.
- **React Hook Form + Zod** for form handling and validation.
- **Lucide React** for modern vector icons.
- **Vanilla CSS (Custom CSS)** for responsive styles, complete dark mode base (with light mode toggle), and animations.

---

## ⚡ Core Business Rules Implemented

-   **Route Protection:** Authenticated clients cannot access `/admin/*` routes. Admins cannot access the client-side booking wizard in `/app/*` (automatic role-based redirects).
-   **Appointment Life Cycle:**
    -   Appointments requested by clients start as `PENDING`.
    -   Appointments created by admins start directly as `CONFIRMED`.
    -   Only `PENDING` and `CONFIRMED` statuses block availability.
    -   Final statuses (`REJECTED`, `CANCELED_BY_CLIENT`, `CANCELED_BY_ADMIN`, `COMPLETED`, `NO_SHOW`) release the slot immediately.
-   **Dynamic Availability Calculation:** No empty slots are persisted. Free slots are calculated on-the-fly by crossing the professional's working hours, active blocks, existing appointments, and the duration of the requested service.
-   **Professional-Service Compatibility:** The frontend filters invalid combinations, and the backend strictly validates and returns a `409 Conflict` if an booking with an incompatible professional is attempted.
-   **Logical Deletion:** Deactivated entities are flagged as `active = false` instead of physically deleted to preserve financial and historical booking records.

---

## 📁 Project Structure

```text
.
├── backend
│   └── Appointment-Manager-API
│       ├── docs/                       # Technical specs and admin use cases
│       ├── src/main/java/com/turnos/api/
│       │   ├── auth/                   # JWT Authentication & Login
│       │   ├── appointments/           # Domain, Services, and Appointment APIs
│       │   ├── availability/           # Working Hours, Blocks, and Slots logic
│       │   ├── professionals/          # Professionals and service assignment
│       │   ├── services/               # Services & Categories CRUD
│       │   ├── users/                  # Client users and profile
│       │   └── config/                 # Security, CORS, and Filters
│       └── pom.xml                     # Maven dependencies
├── frontend
│   ├── docs/                           # Product decisions and SaaS roadmap
│   ├── src/
│   │   ├── app/                        # Router, Providers, and Layouts
│   │   ├── features/                   # Feature-based folders (Auth, Admin, Client)
│   │   ├── shared/                     # Reusable components and hooks
│   │   └── styles/                     # Custom stylesheet (global.css)
│   └── package.json                    # Node.js scripts and packages
└── README.md                           # Main documentation file
```

---

## ⚙️ Local Setup Guide

### Prerequisites
- **Java 17 or 21** installed.
- **Node.js** (v18 or higher).
- **PostgreSQL** running with a database named `appointment_management`.

### 1. Running the Backend
1. Navigate to the backend folder:
   ```bash
   cd backend/Appointment-Manager-API
   ```
2. Configure your database username and password in [application-dev.yml](file:///c:/Users/vale-/CodeProjects/Freelance/BIBE-estetica/backend/Appointment-Manager-API/src/main/resources/application-dev.yml) if they differ from the defaults.
3. Run the development server specifying the `dev` profile (quoted arguments prevent PowerShell parsing errors):
   ```bash
   .\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
   ```
4. The backend will start on `http://localhost:8080` and Swagger docs will be at [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html).

*Initial Admin Credentials (seeded automatically):*
- **Username:** `admin@turnos.local`
- **Password:** `admin1234`

### 2. Running the Frontend
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install the node packages:
   ```bash
   npm.cmd install
   ```
3. Start the Vite development server:
   ```bash
   npm.cmd run dev
   ```
4. The frontend will be accessible at [http://127.0.0.1:5173](http://127.0.0.1:5173).

---

## 🧪 Testing & Quality Assurance

-   **Backend Testing:** An automated test suite containing **84 integration and unit tests** validating status transitions, overlaps, and security filters. You can run it via `.\mvnw.cmd test`.
-   **Frontend E2E Testing:** Functional browser tests written in **Playwright and Python** (located inside the `testsprite_tests/` folder) to simulate complete booking, authentication, and administration flows.

---

## 📈 Future SaaS Roadmap

The system is designed to transition smoothly into a **Multi-tenant SaaS** product. A detailed roadmap is available in [roadmap-saas-local-turnos.md](file:///c:/Users/vale-/CodeProjects/Freelance/BIBE-estetica/frontend/docs/roadmap-saas-local-turnos.md) and highlights:
1.  **Database Partitioning:** Adding a `Business` (tenant) entity and isolating data by filtering queries automatically based on Spring Security contexts.
2.  **Zero-Friction Booking:** Allowing clients to schedule appointments by leaving minimal contact details (Phone/Name) without forcing password registrations.
3.  **Dynamic Branding:** Letting tenants customize their portal with custom colors, logos, preset themes (e.g., Aesthetic Pink, Health Blue, Premium Black), and official WhatsApp links.
