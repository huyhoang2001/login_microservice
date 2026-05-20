# Login and Vietnamese History_Monolithic

## Abstract

This project is a full-stack JavaScript application that combines a user authentication system with a Vietnamese history learning module. The system provides account registration, login, profile access, JWT-based session handling, slider captcha verification, and a protected administration interface for historical content. It is implemented as a development monolith with a React/Vite frontend and an Express backend.

The repository is suitable for academic demonstration, coursework, and small-scale prototyping of authentication workflows, protected routes, local JSON persistence, and legacy HTML integration inside a modern React application.

## Keywords

React, Vite, Express, JWT authentication, slider captcha, JSON storage, protected routes, Vietnamese history, full-stack JavaScript.

## System Overview

The application is organized around three main concerns:

1. User authentication and session management.
2. Captcha-assisted login and registration.
3. Public and protected Vietnamese history pages.

The frontend is responsible for routing, form interaction, authentication state, and embedding the legacy history pages. The backend exposes REST-style API endpoints, validates authentication tokens, manages user data in local JSON files, generates captcha sessions, and serves the history assets.

## Main Features

- User registration and login with password hashing.
- JWT-based authentication using authorization headers and cookies.
- Protected profile and history administration routes.
- Slider captcha generation and verification.
- Local JSON file storage for users and history data.
- Public Vietnamese history page.
- Protected history administration panel.
- Vite development proxy for backend API and history assets.

## Technology Stack

| Layer          | Technology                   |
| -------------- | ---------------------------- |
| Frontend       | React 18, React Router, Vite |
| Backend        | Node.js, Express             |
| Authentication | JSON Web Tokens, bcryptjs    |
| Captcha        | Canvas, Sharp                |
| Storage        | Local JSON files             |
| Development    | concurrently, ESLint         |

## Project Structure

```text
.
+-- backend/
|   +-- assets/                 # Captcha source images and puzzle assets
|   +-- data/                   # Local JSON data storage
|   +-- services/               # Captcha service logic
|   +-- utils/                  # File, request, and security helpers
|   +-- server.js               # Express server entry point
+-- history/
|   +-- admin/                  # Protected history administration page
|   +-- data/                   # Vietnamese history JSON datasets
|   +-- index.html              # Public legacy history page
|   +-- script.js
|   +-- style.css
+-- src/
|   +-- api/                    # Frontend API client
|   +-- components/             # Reusable and authentication components
|   +-- contexts/               # React authentication context
|   +-- pages/                  # Application pages
|   +-- styles/                 # Additional history styles
|   +-- App.jsx                 # Main application routes
|   +-- main.jsx                # React entry point
+-- index.html                  # Vite HTML template
+-- package.json
+-- vite.config.js
```

## Prerequisites

- Node.js 18 or later.
- npm 9 or later.
- A modern web browser.

## Installation

Install dependencies from the repository root:

```sh
npm install
```

Create or update the local environment file if needed:

```env
PORT=3001
JWT_SECRET=replace-this-with-a-secure-secret
```

`JWT_SECRET` is optional during local development because the backend includes a fallback value. For any shared or production-like environment, define a strong secret explicitly.

## Running the Application

Start the backend only:

```sh
npm run start:backend
```

Start the frontend only:

```sh
npm run start:frontend
```

Start frontend and backend together:

```sh
npm run dev
```

The default command also starts both services:

```sh
npm start
```

Default local addresses:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- Public history page: `http://localhost:5173/history`
- Protected history admin page: `http://localhost:5173/history/admin`

## Available Scripts

| Command                  | Description                                           |
| ------------------------ | ----------------------------------------------------- |
| `npm start`              | Runs the development stack.                           |
| `npm run dev`            | Runs backend and frontend concurrently.               |
| `npm run start:backend`  | Starts the Express backend on port `3001` by default. |
| `npm run start:frontend` | Starts the Vite frontend on port `5173`.              |
| `npm run build`          | Builds the frontend with Vite.                        |
| `npm run preview`        | Previews the production frontend build.               |
| `npm run lint`           | Runs ESLint over JavaScript and JSX files.            |

## Application Routes

| Route            | Access    | Description                                  |
| ---------------- | --------- | -------------------------------------------- |
| `/`              | Public    | Home page.                                   |
| `/login`         | Public    | Login form with captcha verification.        |
| `/signup`        | Public    | Registration form with captcha verification. |
| `/profile`       | Protected | User profile page.                           |
| `/history`       | Public    | Vietnamese history page.                     |
| `/history/admin` | Protected | History administration interface.            |

## Backend API Summary

| Method | Endpoint                                   | Access    | Purpose                                |
| ------ | ------------------------------------------ | --------- | -------------------------------------- |
| `GET`  | `/api/health`                              | Public    | Health check and storage status.       |
| `POST` | `/api/signup`                              | Public    | Register a new user.                   |
| `POST` | `/api/login`                               | Public    | Authenticate an existing user.         |
| `GET`  | `/api/profile`                             | Protected | Retrieve current user profile.         |
| `POST` | `/api/logout`                              | Public    | Clear authentication cookie.           |
| `GET`  | `/api/captcha/session`                     | Public    | Create a captcha challenge.            |
| `POST` | `/api/captcha/verify`                      | Public    | Verify captcha input.                  |
| `GET`  | `/api/captcha/image/:sessionId/background` | Public    | Serve captcha background image.        |
| `GET`  | `/api/captcha/image/:sessionId/puzzle`     | Public    | Serve captcha puzzle image.            |
| `GET`  | `/api/history/public/data`                 | Public    | Return public history datasets.        |
| `GET`  | `/api/history/admin/data`                  | Protected | Return history datasets for admin use. |

## Authentication Model

The backend issues a JWT after successful login or signup. The token is returned to the frontend and is also stored in an HTTP cookie by the backend. Frontend API requests include the token in the `Authorization` header when available. Protected backend routes verify the JWT and check that the referenced user exists in local storage.

Passwords are hashed with `bcryptjs` before being written to `backend/data/users.json`.

## Data Storage

This project uses file-based JSON storage rather than a database:

- `backend/data/users.json` stores registered users.
- `history/data/data_trieudai.json` stores dynasty-level history data.
- `history/data/data_detailed.json` stores detailed historical data.

This approach is simple and transparent for academic use, but it is not designed for concurrent production workloads.

## Security Considerations

The project demonstrates common security practices such as password hashing, JWT validation, captcha verification, and protected routes. However, before production deployment, the following items should be reviewed:

- Replace the fallback JWT secret with a strong environment variable.
- Move persistent data to a database.
- Harden cookie settings for the deployment environment.
- Add stricter input validation and rate limiting.
- Remove or protect debug endpoints.
- Replace development-only CDN usage where appropriate.

## Development Notes

The Vite configuration proxies `/api` and `/history` requests to the backend during development. This allows the React application to use the same route structure as the Express server while avoiding cross-origin issues in normal local development.

The history pages are legacy HTML/CSS/JavaScript files embedded through `LegacyHtmlFrame.jsx`. Their assets use absolute `/history/...` paths so that stylesheets, scripts, and JSON datasets resolve consistently when served by the backend or loaded through the React route.

## Testing and Quality Assurance

The repository includes a test file for the slider captcha component:

```text
src/components/auth/SliderCaptcha.test.jsx
```

Recommended verification steps:

```sh
npm run lint
npm run build
```

For a more complete academic or production workflow, add automated tests for:

- Authentication success and failure cases.
- Captcha session generation and verification.
- Protected route access control.
- JSON data loading for public and admin history pages.

## Known Limitations

- The application uses local JSON files instead of a database.
- The history module is implemented as legacy HTML integrated into React.
- Some history page assets rely on external CDNs.
- The project is structured for local development and academic demonstration, not direct production deployment.

## Suggested Future Work

- Replace JSON storage with PostgreSQL, MySQL, or MongoDB.
- Add role-based access control for history administration.
- Implement CRUD endpoints for history data management.
- Add automated backend tests with Supertest.
- Add frontend tests with React Testing Library.
- Configure production Tailwind or remove CDN-based styling.
- Add CI checks for linting, tests, and builds.
