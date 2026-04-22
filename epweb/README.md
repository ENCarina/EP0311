# Epweb - Medical Booking System

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.16. It is a professional medical appointment management system designed for clinic operations.

## 🛠 Tech Stack
* **Framework:** Angular 20.3.16 (Standalone Components, Signals)
* **Runtime:** Node.js 24.11.1
* **Package Manager:** pnpm 9.14.2
* **Auth Pattern:** Token-based authentication (JWT) with LocalStorage
* **State Management:** Angular Signals for reactive state
* **HTTP:** HttpClient with RxJS Pipes & Functional Interceptors
* **Styling:** Bootstrap 5 + Bootstrap Icons
* **External Libs:** SweetAlert2 (dialogs), jsPDF (reporting), ngx-translate (i18n)

## Development server

To start a local development server, run:

```bash
npm install
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## 🔐 Authentication & Role-Based Access (RBAC)

The system utilizes a numeric role-based access control system managed via `AuthService`.

| Role ID | Name | Description |
| :--- | :--- | :--- |
| **0** | User | Regular patient. Can book appointments and view own history. |
| **1** | Staff | Medical professional. Manages own slots and treatments. |
| **2** | Admin | Full system access: user management, stats, and global settings. |

* **Security:** A functional `AuthInterceptor` automatically injects Bearer tokens and handles `401 Unauthorized` errors by triggering the logout flow.

---

## ⚙️ API Configuration

The application uses a centralized configuration system. Services must fetch the API URL from environment files.

**File:** `src/environments/environment.ts`
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api'
};
```
---

## 🏛 Architecture & Standards

### Core Services
* **AuthService:** Manages session signals (`isAuthenticated`, `currentUserRole`).
* **BookingService:** Handles appointment lifecycles and automated slot generation.
* **StaffService:** Manages specialists and user account "Promotion" logic.
* **AdminService:** Provides high-level oversight and KPI dashboard statistics.
* **LoggerService:** Environment-aware logging (suppressed in production).

### Coding Standards
* **Language Policy:** All internal logic (variable names, private methods, console logs) must be in **English**.
* **Logic vs. Template:** All complex business logic must reside in **Services**. Components should only handle UI state and user interactions.
* **Naming:** Private Signals must be prefixed with an underscore (e.g., `_isAuthenticated`).
* **Imports:** Always use relative path imports for environment files (e.g., `../../environments/environment`).

---

## 📂 Project Structure

| Path | Responsibility |
| :--- | :--- |
| `src/app/shared/services/` | Business logic, API calls, and Interceptors |
| `src/app/components/` | Standalone UI Components (Smart & Presentational) |
| `src/environments/` | Environment-specific build configurations |
| `src/public/i18n/` | Internationalization (JSON) translation files |


## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
pnpm ng generate component component-name
pnpm ng generate service service-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
pnpm ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
pnpm ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
