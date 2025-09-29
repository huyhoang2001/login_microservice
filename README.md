#### How to use

Use 2 cmd tabs:
- First Tab & Scan the QR code when displayed
```sh
cd/ frontend-app
```
```sh
npx expo start --clear
```
- Second Tab
```sh
cd/ backend-service-login
```
```sh
npm start
```
or
```sh
npm server.js
```
# 📖 Project Rules & Guidelines

## 1. Code Style

-   **Language**: TypeScript (preferred) or modern JavaScript
    (ES2020+).\
-   **Formatting**: Follow [Prettier](https://prettier.io/)
    configuration.\
-   **Linting**: Enforce ESLint rules before commit.\
-   **Naming**: Use `camelCase` for variables/functions, `PascalCase`
    for components/classes, and `UPPER_CASE` for constants.\
-   **Imports**: Use absolute paths (via `tsconfig.json` aliases)
    instead of deep relative imports when possible.

## 2. Project Structure

-   **Frontend (mobile-app)**:
    -   `app/`: Expo Router entry points only (navigation & routing).\
    -   `src/components/`: Reusable UI, auth, profile, and layout
        components.\
    -   `src/services/`: API clients, storage, and external services.\
    -   `src/hooks/`: Custom React hooks.\
    -   `src/store/`: State management (Zustand/Redux).\
    -   `src/utils/`: Utility functions (validators, formatters,
        helpers).\
    -   `src/types/`: TypeScript type definitions.\
    -   `src/config/`: App configuration (theme, navigation).
-   **Backend (microservices)**:
    -   `auth-service/`: Authentication & authorization.\
    -   `user-service/`: User profile & account management.\
    -   `gateway/`: API gateway with request validation & routing.\
    -   `common/`: Shared modules (DTOs, constants, error handling).

## 3. API & Security

-   Use **RESTful principles** for API design.\
-   All requests must go through the API gateway.\
-   Authentication via **JWT tokens** (access + refresh).\
-   Sensitive data stored only in **secure storage** (never AsyncStorage
    for tokens).\
-   Input validation required at both frontend and backend layers.

## 4. State & Data Flow

-   Centralize auth and user state in `src/store/`.\
-   Use React hooks (`useAuth`, `useUser`, `useForm`) for state
    management logic.\
-   Data fetching must use centralized service modules
    (`auth.service.ts`, `user.service.ts`).

## 5. Testing & Quality Assurance

-   Unit tests for utilities and hooks.\
-   Component tests for reusable UI.\
-   Integration tests for authentication flows.\
-   Use Jest + React Testing Library (frontend) and Jest/Supertest
    (backend).

## 6. Git & Collaboration

-   **Branching model**:
    -   `main` → stable, production-ready.\
    -   `dev` → integration of new features.\
    -   `feature/*` → individual features.\
-   **Commits** follow [Conventional
    Commits](https://www.conventionalcommits.org/) (e.g.,
    `feat: add login form validation`).\
-   **Pull Requests** must pass lint, build, and tests before merge.

## 7. Deployment & CI/CD

-   **Frontend**: Expo EAS builds for iOS/Android.\
-   **Backend**: Dockerized microservices, deployed via Kubernetes or
    Docker Compose.\
-   **CI/CD**: GitHub Actions for linting, tests, and deployment
    pipelines.

