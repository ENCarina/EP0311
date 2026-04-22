# FRONTEND - ANGULAR DEVELOPER DOCUMENTATION

## 🛠 TECH STACK
* **Framework:** Angular 18+ (Standalone Components, Signals)
* **Auth Pattern:** Token-based authentication with LocalStorage
* **State Management:** Angular Signals for reactive state
* **HTTP:** HttpClient with RxJS Pipes & Functional Interceptors
* **Styling:** Bootstrap 5 + Bootstrap Icons
* **External Libs:** SweetAlert2, jsPDF, ngx-translate

---

## 🔐 AUTHENTICATION & ACCESS CONTROL

The application uses a centralized `AuthService` paired with a numeric Role-Based Access Control (RBAC) system.

### State Management (Signals)
* `isAuthenticated`: Tracks the global login status.
* `currentUserRole`: Stores the numeric role ID.
* `currentUserName`: Stores the display name for UI personalization.

### User Roles & Permissions
| Role ID | Name | Description |
| :--- | :--- | :--- |
| **0** | User | Regular patient. Can book appointments and view own history. |
| **1** | Staff | Medical professional. Manages own slots and treatments. |
| **2** | Admin | Full system access: user management, stats, and global settings. |

### Core Methods
| Method | Description |
| :--- | :--- |
| `login(user)` | Executes API call, persists JWT to `localStorage`, and updates state signals. |
| `register(user)` | Handles user creation and session initialization. |
| `logout()` | Clears storage, resets signals, and redirects to `/login`. |
| `hasRole(level)` | Returns `true` if `currentUserRole >= level`. |

---

## 🚀 DEVELOPMENT & CONFIGURATION

### 1. Installation
```cmd
# Install dependencies
npm install

# Start development server
ng serve
-
The application is available at: http://localhost:4200
```

## 2. API Configuration

The application uses a centralized configuration system. To ensure maintainability and environment-specific flexibility, services must never use hardcoded strings for API endpoints.

### 2.1. Environment Files
The base URL for the backend API is defined in the environment configuration files.

**File:** `src/environments/environment.ts` (Development)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api'
};
```

### 2.2. Service Implementation
When creating a service, the `apiUrl` should be initialized to form the full endpoint path. Services must use the centralized environment configuration. Services should not use hardcoded strings for the base API path.

```typescript
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}
}
``` 

### 2.3. Standardized Import Pattern
To maintain a clean and consistent codebase, always use relative path imports when accessing global configurations:
* **Required:** `import { environment } from '../../environments/environment';`
* **Note:** Avoid using absolute paths or complex aliases unless explicitly configured in `tsconfig.json`.

---

## 3. PROJECT STRUCTURE AND STANDARDS

### 📌 Version Control & Metadata
* **Current Version:** `v1.0-beta`
* **Status:** Beta (Feature-complete, stabilization phase)
* **Last Updated:** 2026. April

### Core Services and Logic

#### 1. AuthService
The primary service for security. It manages user sessions using Angular Signals (`isAuthenticated`, `currentUserRole`, `currentUserName`). It handles persistent login by syncing with the browser's **LocalStorage**.

#### 2. StaffService
A specialized service for administrative and medical management. Key capabilities:
* **Staff & Consultation Management:** Retrieves specialists and available treatments.
* **Resource Allocation:** Assigns treatments to staff and bulk-generates appointment slots.
* **User Administration:** Handles user lists, archiving (deleting), and the "Promote" function (upgrading a User to Staff status).

#### 3. AdminService
Dedicated service for high-level system administration.
* **User Control:** Updating profiles, roles, account status (active/inactive), and resetting passwords.
* **Booking Oversight:** Ability to view, delete, or override status for any appointment in the system.
* **System Insights:** Accessing global dashboard statistics and monitoring all available time slots.

#### 4. ConsultationService
Handles the core business logic for medical services and patient bookings.
* **Service Management:** CRUD operations for different types of medical consultations.
* **Booking Integration:** Bridges the gap between available slots and patient appointments through the `createBooking` method.

#### 5. BookingService
Manages the lifecycle of appointments and time slots.
* **Slot Discovery:** Fetches available time intervals based on staff, date range, and consultation type.
* **Booking Management:** Handles creation, retrieval, and cancellation of user-specific appointments.
* **Automated Generation:** Supports `generateStaffSlots` for administrative setup of working hours.

#### 6. LoggerService
A utility service designed to manage application logs efficiently.
* **Environment Awareness:** Uses `isDevMode()` to ensure that detailed error logs and debug information only appear during development.
* **Standardized Output:** Automatically prefixes logs with an English-formatted timestamp (`en-GB`) and a severity level (e.g., ERROR, DEBUG).
* **Production Safety:** Prevents sensitive or unnecessary information from leaking into the end-user's browser console in the production build.

---

### 3.2 HTTP Interceptor (Security & Localization)

The application uses a functional `authInterceptor` to handle outgoing requests globally:

* **Bearer Token Injection:** Automatically attaches the JWT token from `localStorage` to the `Authorization` header.
* **Localization:** Attaches the `Accept-Language` header based on the user's saved preference.
* **Global Error Handling:** If any request returns a `401 Unauthorized` error (and it's not the login request), the interceptor calls `authService.logout()`, clearing all session data and redirecting the user to the login page.
* **SSR Safety:** Includes `isPlatformBrowser` checks to ensure compatibility with Server-Side Rendering.

---

### 3.3. User Roles & Permissions (RBAC)

The system uses a numeric role-based access control (RBAC) system:

| Role ID | Name  | Description |
| :--- | :--- | :--- |
| **0** | User | Regular patient. Can book appointments and view own history. |
| **1** | Staff | Medical professional. Can manage their own slots and treatments. |
| **2** | Admin | System administrator. Full access to user management, stats, and global settings. |

*Note: Role IDs are verified via the `AuthInterceptor` and handled in the UI by the `AuthService.getRoleId()` signal.*

---

### 3.4 Project Directory Structure (Key Paths)
* **Services:** `src/app/shared/services/` (Contains business logic and API calls).
* **Environments:** `src/environments/` (Contains configuration for different build targets).

---

### 3.5 Coding Standards and Quality Control

* **Language Policy:**
    * All logic-level strings, error messages, and default values must be in English.
    * The UI can be translated, but the underlying TypeScript code remains English-only.
* **Naming and Structure:**
    * **Private Signals:** Must be prefixed with an underscore (e.g., `_isAuthenticated`).
    * **Type Safety:** All Service methods should explicitly define their return type (e.g., `Observable<any>`).
    * **Base URL:** Always use `this.baseUrl = environment.apiUrl`.
* **RxJS Best Practices:**
    * Use the `pipe()` method with operators like `tap` for side effects and `catchError` for graceful error handling.


# 4. COMPONENT ARCHITECTURE & STANDARDS

This section outlines the frontend architecture, component responsibilities, and technical standards governing the application.

---

## 4.1. General Principles & Standards

To ensure maintainability and high code quality, the following development standards are mandatory:

* **Logic vs. Template:** All complex business logic must reside within **Services**. Components are restricted to managing UI state and user interactions.
* **Language Policy:** In alignment with backend systems, all internal logic (variable names, private methods, and console logs) must be in **English**.
* **Change Detection:** The application leverages **Angular Signals** for efficient, fine-grained reactivity and state management.
* **Standardized Import Pattern:** Global configurations and environment variables must be accessed via relative path imports:  
    `import { environment } from '../../environments/environment';`

---

## 4.2. Core UI Components

The following components represent the primary building blocks of the user interface.

### 🏗️ Layout & Authentication
* **Root Component (App):** The main orchestrator. Monitors `NavigationEnd` events to toggle between "Full" and "Simplified" layouts, manages global i18n via `TranslateService`, and handles global UI events using `HostListener`.
* **LoginComponent:** Utilizes `ReactiveFormsModule` with strict validation. Handles role-based routing (Admin/Staff to Dashboard, Users to `returnUrl`) and provides localized feedback via `SweetAlert2`.
* **Password Recovery Flow:**
    * **ForgotPasswordComponent:** Handles initial recovery requests by sending a reset link to the user's verified email address.
    * **ResetPasswordComponent:** Secure interface for entering a new password, utilizing token-based validation from the URL to ensure session integrity.

### 📅 Scheduling & User Workflows
* **BookingComponent (Scheduling Engine):** * Implements ISO-compliant date communication using the `sv-SE` locale.
    * Features a three-tier cascading filter: **Specialty → Staff → Treatment**.
    * Enforces lead-time validation to ensure only future slots are selectable.
    * Supports Deep Linking via query parameters for direct doctor-access.
* **MyBookingComponent:** Personalized patient portal for managing medical history.
    * Enforces a strict 24-hour cancellation policy via client-side timestamp comparison.
    * Utilizes Angular Signals (`bookings.update()`) for instantaneous UI feedback.

### 📊 Analytical & Admin Interfaces
* **AdminDashboardComponent:** * **KPI Aggregation:** Processes raw data streams using `rxjs/forkJoin` to calculate financial health and booking trends.
    * **Resource Utilization:** Visualizes staff efficiency against a standard 40-hour capacity.
    * **Visualization:** Implements a time-day coordinate system (Heatmap) to identify peak consultation hours.
    * **Reporting:** Generates localized, structured PDF reports using `jsPDF` and `jspdf-autotable`.

---

## 4.3. Project Directory Structure

To maintain a clean architecture, the following directory layout is standardized:

| Path | Responsibility |
| :--- | :--- |
| `src/app/shared/services/` | Business logic, API calls, and Interceptors |
| `src/app/components/` | UI Components (Smart & Presentational) |
| `src/environments/` | Environment-specific build configurations |
| `src/public/i18n/` | Internationalization (JSON) translation files |


## 5. SUMMARY & TECHNICAL HIGHLIGHTS

The ElitPort Medical Booking System is a comprehensive, modern web application built on the latest **Angular (v18+)** technologies. Throughout development, the primary focus remained on user experience, security, and scalability.

### 🚀 Technical Achievements

* **Modern State Management:** The application leverages Angular’s latest **Signals-based reactivity**, providing faster change detection and superior performance compared to traditional mechanisms.
* **Secure Authentication:** A robust, **JWT-based authentication** system has been implemented, featuring three-tier role management (User, Staff, Admin) and an automatic `AuthInterceptor` to secure protected endpoints.
* **Data Visualization & Analytics:** The Admin Dashboard does more than just display data; it executes complex **business logic** (KPI calculations, Heatmap visualization) on the client side to assist in clinic resource planning.
* **Multi-language Support:** By integrating the `@ngx-translate` library, the system provides full English and Hungarian support, including the handling of dynamic server-side messages.

### 💡 Business Value

The software effectively automates manual administrative processes:

* **Medical Capacity Utilization:** Automates scheduling to eliminate overlaps and idle time.
* **Patient Engagement:** Intuitive booking workflow and personalized user accounts (My Bookings).
* **Data-Driven Decision Making:** Structured PDF reporting and financial statistics for management review.

---

### 🛠 Tech Stack Overview

* **Frontend:** Angular 18 (Signals, Standalone Components, Router, Reactive Forms)
* **Styling:** Bootstrap 5 + Bootstrap Icons (Responsive UI)
* **Communication:** RxJS (Observables, forkJoin, pipeable operators)
* **Reporting:** jsPDF & jsPDF-AutoTable
* **UI Elements:** SweetAlert2 (Interactive dialogs)
* **Localization:** ngx-translate


---

## 🔗 LINKS & DOCUMENTATION

### Project Repository
* **GitHub Repository:** [https://github.com/your-username/your-repo-name](https://github.com/ENCarina/EP04)

### Local Documentation
You can find further details about the project in the following files:

* **README Documentation:** [README.md](./README.md)
* **Frontend Development Guide:** [frontend_dev.md](./frontend_dev.md)
* 
---

