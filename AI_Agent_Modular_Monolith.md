# Refactoring Plan: History_Monolithic → Web-Only Modular Monolith (JavaScript Edition)

> **For AI Agent:** Execute **strictly sequentially** from Phase 0 through Phase 5. After completing each phase, you **must** run the designated verification command and confirm zero errors before proceeding. **Never alter business logic, API endpoint signatures, or JSON data file content.** This plan is purely a structural reorganization for optimization, scalability, and maintainability. **All files must remain `.js` or `.jsx` — TypeScript conversion is strictly forbidden.**

---

## Table of Contents

1. [Architectural Overview](#architectural-overview)
2. [Target Directory Structure](#target-directory-structure)
3. [Phase 0 — Cleanup & Dead Code Removal](#phase-0--cleanup--dead-code-removal)
4. [Phase 1 — Directory Restructuring](#phase-1--directory-restructuring)
5. [Phase 2 — Shared Layer & Configuration](#phase-2--shared-layer--configuration)
6. [Phase 3 — Backend Module & Middleware Refactoring](#phase-3--backend-module--middleware-refactoring)
7. [Phase 4 — Frontend Routing, Aliases & Error Boundaries](#phase-4--frontend-routing-aliases--error-boundaries)
8. [Phase 5 — Monorepo Root, Tooling & Final Verification](#phase-5--monorepo-root-tooling--final-verification)
9. [Core Inviolable Rules](#core-inviolable-rules)

---

## Architectural Overview

| Category | Current State | Target Modular Monolith |
|---|---|---|
| **Mobile Capability** | Expo app in `app/` | **Completely removed** — 100% Web focus |
| **Frontend Structure** | Flat `src/` with mixed layers | `web/src/modules/` — strict domain isolation |
| **Backend Architecture** | Monolithic `server.js` | Decoupled `modules/auth`, `modules/history`, `modules/admin` |
| **TypeScript Contamination** | `.ts`/`.tsx` files present | Renamed to `.js`/`.jsx` — full JS compliance |
| **Code Duplication** | Scattered `.optimized` files | Merged into single source of truth per feature |
| **System Resilience** | No env validation, missing error handling | Zod config validation + Global Error Boundary + Error Middleware |
| **Scalability** | Direct JSON read/write helpers | Centralized `DataStore` class for future DB migration readiness |
| **Build Artifacts** | `backend/dist/` mixed with `src/` | Agent operates only on `src/` — `dist/` is compiled output, never touched |

---

## Target Directory Structure

```text
History_Monolithic/
├── web/                                    ← Frontend workspace (Vite + React + JS)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── pages/
│   │   │   │   │   ├── Login.jsx
│   │   │   │   │   ├── Signup.jsx
│   │   │   │   │   └── Profile.jsx
│   │   │   │   ├── components/
│   │   │   │   │   ├── AuthPortalShell.jsx
│   │   │   │   │   ├── CaptchaModal.jsx
│   │   │   │   │   └── SliderCaptcha.jsx       ← Merged from base + .optimized
│   │   │   │   └── contexts/
│   │   │   │       └── AuthContext.jsx
│   │   │   ├── history/                        ← Public-facing interfaces
│   │   │   │   ├── pages/
│   │   │   │   │   ├── Home.jsx
│   │   │   │   │   └── HistoryPublic.jsx
│   │   │   │   └── styles/
│   │   │   │       └── history.css
│   │   │   └── admin/                          ← Protected module (Admin only)
│   │   │       ├── pages/
│   │   │       │   └── HistoryAdmin.jsx
│   │   │       ├── panels/
│   │   │       │   ├── AdminPanel.jsx
│   │   │       │   ├── PlaceholderView.jsx
│   │   │       │   └── SettingsView.jsx        ← Retained from current structure
│   │   │       ├── managers/
│   │   │       │   ├── DynastyManager.jsx
│   │   │       │   ├── CharacterManager.jsx
│   │   │       │   ├── CalendarEventManager.jsx
│   │   │       │   ├── AssetManager.jsx
│   │   │       │   └── TimelineEditor.jsx
│   │   │       ├── components/
│   │   │       │   ├── AdminHeader.jsx
│   │   │       │   ├── Sidebar.jsx
│   │   │       │   ├── Modal.jsx
│   │   │       │   └── Toast.jsx
│   │   │       ├── hooks/
│   │   │       │   └── useAdminData.js
│   │   │       └── styles/
│   │   │           └── history-admin.css
│   │   ├── shared/
│   │   │   ├── api/
│   │   │   │   └── client.js                   ← Shared Axios client
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.js                  ← Auth state management hook
│   │   │   ├── utils/
│   │   │   │   └── asset.js                    ← Dynamic asset path utility
│   │   │   ├── components/
│   │   │   │   ├── ErrorBoundary.jsx           ← Global crash prevention
│   │   │   │   └── LegacyHtmlFrame.jsx         ← Retained (legacy iframe wrapper)
│   │   │   └── styles/
│   │   │       └── index.css
│   │   ├── router/
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── AdminRoute.jsx
│   │   ├── App.jsx                             ← Centralized routing entry
│   │   └── main.jsx
│   ├── public/                                 ← Vite static assets
│   │   └── placeholder-image.png
│   ├── index.html
│   ├── vite.config.js
│   ├── jsconfig.json
│   └── package.json
│
├── backend/                                ← Backend workspace (Node.js + Express + JS)
│   ├── src/                                ← Agent works ONLY in src/ — never dist/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.routes.js
│   │   │   │   ├── auth.controller.js
│   │   │   │   └── auth.service.js
│   │   │   ├── history/
│   │   │   │   ├── history.routes.js
│   │   │   │   ├── history.controller.js
│   │   │   │   └── history.service.js
│   │   │   └── admin/
│   │   │       ├── admin.routes.js
│   │   │       ├── admin.controller.js
│   │   │       └── admin.service.js            ← New: delegates to history.service
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   ├── rateLimit.js                    ← New: express-rate-limit wrapper
│   │   │   ├── cors.js
│   │   │   └── error.middleware.js
│   │   ├── services/
│   │   │   └── captcha.service.js              ← Merged captcha logic
│   │   ├── utils/
│   │   │   ├── fileStorage.js                  ← DataStore class
│   │   │   ├── requestHelpers.js
│   │   │   └── security.js
│   │   └── config/
│   │       ├── index.js
│   │       └── schema.js
│   ├── data/
│   │   ├── history/                            ← Reorganized from data_history/
│   │   │   ├── data_data_lichnienbieu.json
│   │   │   ├── data_detailed.json
│   │   │   ├── data_lichnienbieu.json
│   │   │   └── data_trieudai.json
│   │   └── users.json
│   ├── assets/
│   │   ├── image/
│   │   ├── image_history/
│   │   └── puzzle/
│   ├── dist/                                   ← Compiled output — DO NOT TOUCH
│   └── package.json
│
├── scripts/
│   ├── reset-project.js
│   └── migrate-data.js
├── .env.example
├── .gitignore
├── eslint.config.js
├── package.json                                ← Monorepo workspace root
└── README.md
```

---

## Phase 0 — Cleanup & Dead Code Removal

**Goal:** Eliminate all Mobile (Expo) artifacts, dead code directories, duplicated files, and TypeScript file extensions before any structural changes are made.

### 0.1 — Pre-Deletion Safety Check (Captcha Merge)

**Before deleting any `.optimized` file**, complete the following merge:

1. Open `.phase0_cache/captchaService.optimized.js.bak` and `.phase0_cache/SliderCaptcha.optimized.jsx.bak`
2. Diff each against its base counterpart (`captcha.service.js` and `SliderCaptcha.jsx`)
3. If the `.optimized` version contains any algorithmic improvements (coordinate validation, canvas rendering, timing logic), extract and integrate them into the base file
4. **Do not alter the UI structure, CSS class names, or props interface of `SliderCaptcha.jsx` in any way**
5. Confirm the merged file produces identical visual output and behavior to the original before proceeding

### 0.2 — Remove Expo Mobile Platform

```bash
# Remove Expo app platform code
rm -rf app/
rm app.json
rm expo-env.d.ts

# Remove Expo root-level assets (RETAIN backend/assets/ — different directory)
rm -rf assets/
```

### 0.3 — Remove Garbage, Test, and Legacy Directories

```bash
rm -rf teest/
rm -rf anhmau/
rm test-setup.js
rm -rf src/history/           # Legacy App.jsx + App.css — superseded by modules/history/
rm index.html                 # Will be relocated to web/index.html in Phase 1
```

### 0.4 — Remove Duplicated Logic Files

```bash
rm .phase0_cache/captchaService.optimized.js.bak
rm .phase0_cache/SliderCaptcha.optimized.jsx.bak
rm src/components/ui/ConnectionTest.js
rm src/components/ui/NetworkTest.js
```

### 0.5 — Rename TypeScript Files to JavaScript (CRITICAL)

The following files currently use TypeScript extensions. Rename them — do **not** alter their content or logic. Only change the file extension and fix any `.ts`/`.tsx` import references that point to them.

| Current Path | Renamed To |
|---|---|
| `src/shared/api/client.ts` | `src/shared/api/client.js` |
| `src/shared/hooks/useAuth.ts` | `src/shared/hooks/useAuth.js` |
| `src/shared/components/ErrorBoundary.tsx` | `src/shared/components/ErrorBoundary.jsx` |
| `src/shared/types/index.ts` | `src/shared/types/index.js` |
| `src/shared/utils/asset.ts` | `src/shared/utils/asset.js` |
| `src/router/AdminRoute.tsx` | `src/router/AdminRoute.jsx` |

After renaming, perform a global search for any remaining `.ts` or `.tsx` import strings in `src/` and update them to `.js`/`.jsx`.

### 0.6 — Phase 0 Verification

```bash
# Confirm no TypeScript files remain in the frontend src directory
find src/ -name "*.ts" -o -name "*.tsx" | grep -v node_modules

# Expected output: empty (zero results)
```

---

## Phase 1 — Directory Restructuring

**Goal:** Relocate the frontend source into an independent `web/` workspace and confirm all module boundaries are correctly established.

### 1.1 — Create the Web Workspace

```bash
mkdir -p web/src
mkdir -p web/public
```

### 1.2 — Migrate Frontend Source

```bash
# Move the entire src/ into web/src/
mv src/* web/src/

# Move frontend config files into web/
mv vite.config.js web/vite.config.js
mv index.html web/index.html

# Move frontend package.json into web/ (keep root package.json separate)
# Rename it first to avoid ambiguity
cp package.json web/package.json
# The root package.json will be fully replaced in Phase 5
```

### 1.3 — Add Vite Public Asset

```bash
# Create a placeholder image used by asset.js as a fallback
# Copy any 1x1 transparent PNG or small placeholder into web/public/
cp <any_available_image> web/public/placeholder-image.png
```

### 1.4 — Create `web/jsconfig.json`

This replaces any prior `tsconfig.json` and provides IDE path alias support for the `@/` shorthand.

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "checkJs": false,
    "jsx": "react-jsx"
  },
  "include": ["src/**/*"]
}
```

### 1.5 — Verify Module Distribution

Confirm the following directories exist and contain the correct files after migration. **Do not consolidate HTML tags, alter CSS class names, modify Hook logic (useState, useEffect), or change any props interface.**

| Module | Path |
|---|---|
| Auth | `web/src/modules/auth/` — pages/, components/, contexts/ |
| History (public) | `web/src/modules/history/` — pages/, styles/ |
| Admin (protected) | `web/src/modules/admin/` — pages/, panels/, managers/, components/, hooks/, styles/ |
| Shared | `web/src/shared/` — api/, hooks/, utils/, components/, styles/ |
| Router | `web/src/router/` — ProtectedRoute.jsx, AdminRoute.jsx |

### 1.6 — Reorganize Backend Data Directory

The backend `data/` directory currently has JSON files in a flat `data_history/` folder. Reorganize to match the target:

```bash
mkdir -p backend/data/history

# Move history JSON files into the new history/ subdirectory
mv backend/data/data_history/data_data_lichnienbieu.json backend/data/history/
mv backend/data/data_history/data_detailed.json backend/data/history/
mv backend/data/data_history/data_lichnienbieu.json backend/data/history/
mv backend/data/data_history/data_trieudai.json backend/data/history/

# Remove now-empty legacy directory
rm -rf backend/data/data_history/
```

> **CRITICAL:** Do not modify the **content** of any `.json` file. Only the file path changes.

After moving, update all backend source references (`backend/src/`) that previously pointed to `data_history/` to point to `data/history/`. Do a global search:

```bash
grep -r "data_history" backend/src/
# Update every match to use "data/history" instead
```

### 1.7 — Create Scripts Directory

```bash
mkdir -p scripts
touch scripts/reset-project.js
touch scripts/migrate-data.js
```

Add a comment header to each so the agent knows they are stub files for future implementation:

```js
// scripts/reset-project.js
// Stub: Resets development data to seed state. Implement as needed.

// scripts/migrate-data.js
// Stub: Migrates flat JSON data to a database. Implement when DB is introduced.
```

### 1.8 — Phase 1 Verification

```bash
cd web && npm install && npm run build
# Expected: zero build errors, zero TypeScript errors
```

---

## Phase 2 — Shared Layer & Configuration

**Goal:** Establish the shared API client, utility functions, auth hook, and Zod-validated environment configuration. These files form the cross-cutting foundation all modules depend on.

### 2.1 — Shared Axios API Client

**File:** `web/src/shared/api/client.js`

```js
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 2.2 — Auth State Hook

**File:** `web/src/shared/hooks/useAuth.js`

```js
import { useContext } from 'react';
import { AuthContext } from '@/modules/auth/contexts/AuthContext';

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');

  return {
    user: ctx.user,
    isAdmin: ctx.user?.role === 'admin',
    isAuthenticated: !!ctx.user,
    isLoading: ctx.isLoading,
    login: ctx.login,
    logout: ctx.logout,
  };
};
```

### 2.3 — Dynamic Asset Path Utility

**File:** `web/src/shared/utils/asset.js`

All image `src` attributes that reference backend-served assets **must** pass through this function to prevent broken images caused by the directory restructure.

```js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const getAssetUrl = (relativePath) => {
  if (!relativePath) return '/placeholder-image.png';
  if (relativePath.startsWith('http')) return relativePath;
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return `${API_URL}/${cleanPath}`;
};
```

**Agent Task:** Search all `.jsx` files in `web/src/` for `<img src={` patterns where the value is a dynamic variable (not a static import). Replace each with `<img src={getAssetUrl(variable)} />`. Import `getAssetUrl` from `@/shared/utils/asset`. **Do not remove or modify any existing `className`, `alt`, or `style` attributes on the `<img>` tags.**

### 2.4 — Backend Environment Schema

**File:** `backend/src/config/schema.js`

```js
import { z } from 'zod';

export const configSchema = z.object({
  PORT: z.string().default('3001').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DATA_DIR: z.string().default('./data'),
});
```

### 2.5 — Backend Config Entry Point

**File:** `backend/src/config/index.js`

```js
import { configSchema } from './schema.js';
import dotenv from 'dotenv';

dotenv.config();

const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('[Config] Environment validation failed:');
  console.error(parsed.error.flatten());
  process.exit(1);
}

export const config = parsed.data;
```

### 2.6 — Root `.env.example`

**File:** `.env.example` (at project root)

```bash
# ─── Backend Configuration ────────────────────────────────────
PORT=3001
NODE_ENV=development
JWT_SECRET=replace_with_a_highly_secure_secret_string_over_32_chars
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
DATA_DIR=./backend/data

# ─── Frontend Configuration ───────────────────────────────────
VITE_API_URL=http://localhost:3001
```

### 2.7 — Phase 2 Verification

```bash
cd backend && node -e "import('./src/config/index.js').then(() => console.log('Config OK'))"
# Expected: "[Config] Modular monolith config loaded." or no errors
```

---

## Phase 3 — Backend Module & Middleware Refactoring

**Goal:** Decompose the monolithic `server.js` into independent module units, implement centralized error handling, rate limiting, and the DataStore abstraction layer. All files use ES Module syntax (`import`/`export`).

> **CRITICAL REMINDER:** `backend/dist/` is compiled output. **Never move, edit, or restructure anything inside `dist/`.** All work in this phase targets `backend/src/` exclusively.

### 3.1 — DataStore Class (JSON Abstraction Layer)

**File:** `backend/src/utils/fileStorage.js`

This class decouples all controllers from direct filesystem calls. When a database is introduced in the future, only this file requires modification.

```js
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config/index.js';

export class DataStore {
  constructor(fileName) {
    this.filePath = path.resolve(config.DATA_DIR, fileName);
  }

  async getAll() {
    const raw = await fs.readFile(this.filePath, 'utf-8');
    return JSON.parse(raw);
  }

  async getById(id) {
    const items = await this.getAll();
    return items.find((item) => item.id === id) ?? null;
  }

  async create(item) {
    const items = await this.getAll();
    items.push(item);
    await this._save(items);
    return item;
  }

  async update(id, patch) {
    const items = await this.getAll();
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...patch };
    await this._save(items);
    return items[idx];
  }

  async delete(id) {
    const items = await this.getAll();
    const filtered = items.filter((i) => i.id !== id);
    if (filtered.length === items.length) return false;
    await this._save(filtered);
    return true;
  }

  async _save(items) {
    await fs.writeFile(this.filePath, JSON.stringify(items, null, 2), 'utf-8');
  }
}
```

### 3.2 — Centralized Express App

**File:** `backend/src/app.js`

```js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from './middleware/cors.js';
import { rateLimiter } from './middleware/rateLimit.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { historyRouter } from './modules/history/history.routes.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Core middleware
app.use(express.json());
app.use(cors);
app.use(rateLimiter);

// Module routes
app.use('/api/auth', authRouter);
app.use('/api/history', historyRouter);
app.use('/api/admin', adminRouter);

// Static asset serving for historical images
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// Centralized error boundary — must be last
app.use(errorHandler);

export default app;
```

### 3.3 — Server Entry Point

**File:** `backend/src/server.js`

```js
import app from './app.js';
import { config } from './config/index.js';

app.listen(config.PORT, () => {
  console.log(`[Server] Modular monolith running at: http://localhost:${config.PORT}`);
  console.log(`[Server] Environment: ${config.NODE_ENV}`);
});
```

### 3.4 — Centralized Error Middleware

**File:** `backend/src/middleware/error.middleware.js`

```js
export const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected server error occurred.';

  console.error(`[Error Boundary] ${req.method} ${req.url} — ${status}: ${message}`);

  res.status(status).json({
    success: false,
    error: message,
  });
};
```

### 3.5 — Rate Limiter Middleware

**File:** `backend/src/middleware/rateLimit.js`

```js
import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 200,                   // Max requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
  },
});
```

### 3.6 — Admin Service (Delegating Pattern)

**File:** `backend/src/modules/admin/admin.service.js`

The `admin` module delegates data operations to `history.service` rather than duplicating data access logic. This avoids redundancy while keeping module boundaries clear.

```js
// admin.service.js delegates to history.service for shared data operations.
// Admin-specific business logic (e.g., bulk operations, audit logging) goes here.
import * as historyService from '../history/history.service.js';

export const getAllHistoryData = historyService.getAllHistoryData;
export const updateDynasty = historyService.updateDynasty;
export const updateCharacter = historyService.updateCharacter;

// Add admin-specific operations below as the feature grows:
// export const bulkUpdateDynasties = async (updates) => { ... };
```

### 3.7 — Utility Stubs

Create these utility files if they do not already exist in `backend/src/utils/`. **If they exist with business logic, preserve all logic — only add the file if absent.**

**File:** `backend/src/utils/requestHelpers.js`

```js
// Utility functions for request/response normalization.
// Add shared helper functions here as patterns emerge across controllers.

export const sendSuccess = (res, data, status = 200) => {
  res.status(status).json({ success: true, data });
};

export const sendError = (res, message, status = 400) => {
  res.status(status).json({ success: false, error: message });
};
```

**File:** `backend/src/utils/security.js`

```js
// Security utilities: password hashing, token generation, sanitization.
// Centralize all security-sensitive operations here.
// Populate with logic extracted from auth.controller.js / auth.service.js.

// Example structure — implement based on existing auth logic:
// export const hashPassword = async (plain) => { ... };
// export const verifyPassword = async (plain, hash) => { ... };
// export const generateToken = (payload, secret, expiresIn) => { ... };
```

> **Agent Task:** Review `backend/src/modules/auth/auth.service.js` and `auth.controller.js`. Extract any inline password hashing or token generation logic into `security.js`, then import it back. Do not alter the function signatures or behavior.

### 3.8 — Phase 3 Verification

```bash
cd backend && npm run dev
# Expected: Server starts on port 3001, no import errors, no uncaught exceptions
# Test: curl http://localhost:3001/api/history — should return data
```

---

## Phase 4 — Frontend Routing, Aliases & Error Boundaries

**Goal:** Configure Vite path aliases, establish multi-tier protected routing, wrap the application in a global error boundary, and standardize the App routing tree.

### 4.1 — Vite Configuration with Path Aliases

**File:** `web/vite.config.js`

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/assets': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          axios: ['axios'],
        },
      },
    },
  },
});
```

> **Note:** The `/assets` proxy is added so that `getAssetUrl()` calls resolve correctly during local development without needing absolute URLs.

### 4.2 — Global Error Boundary Component

**File:** `web/src/shared/components/ErrorBoundary.jsx`

If this file already exists (previously `.tsx`), ensure its content matches the below — do not alter the UI structure, only the extension and any TS-specific type annotations.

```jsx
import React, { Component } from 'react';

export class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[UI Error Boundary] Render failure detected:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h2>An unexpected display error has occurred.</h2>
          <p>Your data is safe. Please refresh the page or return to the homepage.</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ padding: '10px 20px', cursor: 'pointer', marginRight: '10px' }}
          >
            Try Again
          </button>
          <button
            onClick={() => { window.location.href = '/'; }}
            style={{ padding: '10px 20px', cursor: 'pointer' }}
          >
            Return to Homepage
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### 4.3 — Application Entry Point with Error Boundary

**File:** `web/src/main.jsx`

Wrap the root `<App />` in `GlobalErrorBoundary`. Do not alter any other logic in this file.

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { GlobalErrorBoundary } from '@/shared/components/ErrorBoundary.jsx';
import '@/shared/styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>
);
```

### 4.4 — Protected Route (Authenticated Users)

**File:** `web/src/router/ProtectedRoute.jsx`

If this file already exists with correct logic, only update the import path for `useAuth` to use the `@/` alias. Do not alter the guard logic.

```jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div style={{ padding: '20px' }}>Verifying session...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
}
```

### 4.5 — Admin Route (Role-Gated)

**File:** `web/src/router/AdminRoute.jsx`

```jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';

export default function AdminRoute() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) return <div style={{ padding: '20px' }}>Verifying permissions...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
}
```

### 4.6 — Centralized Application Router

**File:** `web/src/App.jsx`

If this file already exists, update **only** the import paths to use `@/` aliases. Do not change route paths, component names, or nesting structure.

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/modules/auth/contexts/AuthContext';
import ProtectedRoute from '@/router/ProtectedRoute';
import AdminRoute from '@/router/AdminRoute';
import Home from '@/modules/history/pages/Home';
import HistoryPublic from '@/modules/history/pages/HistoryPublic';
import HistoryAdmin from '@/modules/admin/pages/HistoryAdmin';
import Login from '@/modules/auth/pages/Login';
import Signup from '@/modules/auth/pages/Signup';
import Profile from '@/modules/auth/pages/Profile';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/history" element={<HistoryPublic />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Authenticated member routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Admin-exclusive routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin/*" element={<HistoryAdmin />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

### 4.7 — Import Path Audit (All Frontend Files)

After completing 4.1–4.6, perform a global search across all files in `web/src/` for any remaining legacy relative imports that can be replaced with the `@/` alias:

```bash
# Find remaining deep relative imports (3+ levels) that should use @/ alias
grep -r "from '\.\./\.\." web/src/ --include="*.jsx" --include="*.js"
```

For every match, replace the relative path with its `@/` equivalent. For example:

```js
// Before
import { useAuth } from '../../../shared/hooks/useAuth';

// After
import { useAuth } from '@/shared/hooks/useAuth';
```

### 4.8 — Phase 4 Verification

```bash
cd web && npm run dev
# Expected: Vite dev server starts on port 5173, zero console errors
# Test: Navigate to /, /login, /history in browser — all pages render correctly
# Test: Navigate to /admin — redirects to / or /login as expected for unauthenticated user
```

---

## Phase 5 — Monorepo Root, Tooling & Final Verification

**Goal:** Configure the root workspace to orchestrate both workspaces, install remaining dependencies, and run end-to-end verification across the full system.

### 5.1 — Root `package.json` (Monorepo Workspace)

**File:** `package.json` (project root — replace existing content)

```json
{
  "name": "history-monolithic",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "web",
    "backend"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:web\"",
    "dev:web": "npm --prefix web run dev",
    "dev:backend": "npm --prefix backend run dev",
    "build": "npm run build:backend && npm run build:web",
    "build:web": "npm --prefix web run build",
    "build:backend": "npm --prefix backend run build",
    "lint": "eslint web/src backend/src --ext .jsx,.js",
    "lint:fix": "eslint web/src backend/src --ext .jsx,.js --fix"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

### 5.2 — Backend `package.json` — Confirm Dev Script

Ensure `backend/package.json` has a `dev` script using `nodemon`. If it uses `ts-node` or any TypeScript runner, replace with the plain JS equivalent:

```json
{
  "scripts": {
    "dev": "nodemon --experimental-vm-modules src/server.js",
    "start": "node src/server.js",
    "build": "echo 'No build step required for JS backend'"
  },
  "type": "module"
}
```

### 5.3 — Web `package.json` — Confirm Dev Script

Ensure `web/package.json` has:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 5.4 — Dependency Installation

Run from the **project root**:

```bash
# Root-level concurrently
npm install -D concurrently

# Backend additions
npm install express-rate-limit zod dotenv --prefix backend
npm install -D nodemon --prefix backend

# Confirm frontend axios is present
npm install axios --prefix web
```

### 5.5 — Final End-to-End Verification Checklist

Execute each check in order. Do not mark the migration complete until all pass.

**Step 1 — TypeScript remnant check:**
```bash
find web/src backend/src -name "*.ts" -o -name "*.tsx" | grep -v node_modules
# Expected: zero results
```

**Step 2 — Full system boot:**
```bash
npm run dev
# Expected: Both servers start cleanly
#   [0] [Server] Modular monolith running at: http://localhost:3001
#   [1] VITE ready on http://localhost:5173
```

**Step 3 — Backend API smoke tests:**
```bash
curl http://localhost:3001/api/history
# Expected: 200 OK with JSON data array

curl http://localhost:3001/api/auth/login -X POST -H "Content-Type: application/json" \
  -d '{"username":"test","password":"wrongpassword"}'
# Expected: 401 or 400 JSON error — confirms auth module is responding

curl http://localhost:3001/api/admin
# Expected: 401 Unauthorized — confirms admin route requires auth
```

**Step 4 — Frontend route verification (browser):**

| Route | Expected Behavior |
|---|---|
| `http://localhost:5173/` | Home page renders |
| `http://localhost:5173/history` | History public page renders |
| `http://localhost:5173/login` | Login form renders |
| `http://localhost:5173/signup` | Signup form renders |
| `http://localhost:5173/profile` | Redirects to `/login` (unauthenticated) |
| `http://localhost:5173/admin` | Redirects to `/login` or `/` (unauthenticated) |

**Step 5 — UI/UX parity check:**
Visually compare each page against the original. Confirm:
- All CSS class names produce identical visual output
- Slider Captcha renders and functions identically
- Image assets load without 404 errors
- Admin panel (when authenticated) shows all managers and panels

**Step 6 — Production build test:**
```bash
npm run build
# Expected: web/dist/ and backend ready — zero build errors, zero warnings about missing modules
```

---

## Core Inviolable Rules

These rules apply for the **entire duration** of this migration. Any instruction in the phases above that appears to conflict with these rules is an error — these rules take precedence.

| # | Rule | Detail |
|---|---|---|
| 1 | **Strict sequential execution** | Execute Phase 0 → 1 → 2 → 3 → 4 → 5. No phase may be skipped or reordered. |
| 2 | **No business logic alteration** | Never rewrite Captcha generation, slider coordinate validation, history data filtering, auth token logic, or password hashing. |
| 3 | **No TypeScript** | All files must be `.js` or `.jsx`. No `.ts`, `.tsx`, `interface`, `type`, or generic type syntax in any file. |
| 4 | **No UI/UX changes** | Do not consolidate, rename, add, or remove HTML tags. Do not change CSS class names, inline styles, or component prop interfaces. The rendered UI must be pixel-identical to the original. |
| 5 | **No data file modification** | The content of every `.json` file in `backend/data/` is immutable. Only file paths change. |
| 6 | **Never touch `backend/dist/`** | This directory is compiled output. It is not source code. Do not read from it, write to it, or use it as a reference for refactoring. |
| 7 | **Synchronous import updates** | When a file is moved, immediately update all import paths that reference it in the same step. Never leave dangling relative imports. |
| 8 | **Alias all deep imports** | Any import with 3 or more `../` levels must be replaced with `@/` alias notation during migration. |
| 9 | **Build verification between phases** | Run the phase-specific verification command after each phase and confirm zero errors before starting the next. |
| 10 | **Preserve original data references** | If any module previously read from `data_history/`, update only the path string — never the parse logic, field names, or data structures. |