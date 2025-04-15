# Implementation Plan for Converting Golf Compete to API-Based Architecture

## Overview

This document outlines the step-by-step implementation plan for transitioning Golf Compete to an API-based architecture. Each step builds on the previous one, ensuring a structured and efficient transition. The focus is on creating API endpoints for the front-end and an internal tool/service layer for Supabase interactions, deferring the specific MCP layer for AI consumption to a later phase.

## Steps to Implementation

### 1. Identify Supabase Dependencies

- **Objective**: Audit the current codebase to list all instances where Supabase is directly accessed.
- **Tasks**:
  - Review the codebase to identify all Supabase calls.
  - Categorize these calls into authentication, data retrieval, and data manipulation.
  - Document the findings to inform the design of API endpoints and internal tools.
- **Findings**:
  - **Authentication**:
    - `supabase.auth.getSession()`: Used in various components and contexts (`authService.ts`, `middleware.ts`, `AuthContext.tsx`, `Navbar.tsx`, `CourseCreationWizard.tsx`, `profileService.ts`, `supabase.ts`, `SeriesAuthGuard.tsx`, `login/page.tsx`, `callback/page.tsx`)
    - `supabase.auth.getUser()`: Used in `authService.ts`, `supabase.ts`
    - `supabase.auth.signInWithPassword()`: Used in `authService.ts`, `login/page.tsx`
    - `supabase.auth.signUp()`: Used in `authService.ts`, `userService.ts`
    - `supabase.auth.signOut()`: Used in `authService.ts`, `AuthContext.tsx`, `supabase.ts`, `login/page.tsx`
    - `supabase.auth.resetPasswordForEmail()`: Used in `authService.ts`, `supabase.ts`
    - `supabase.auth.updateUser()`: Used in `authService.ts`, `supabase.ts`
    - `supabase.auth.onAuthStateChange()`: Used in `authService.ts`, `AuthContext.tsx`
    - `supabase.auth.refreshSession()`: Used in `AuthContext.tsx`, `CourseCreationWizard.tsx`
    - `supabase.auth.exchangeCodeForSession()`: Used in `callback/page.tsx`
    - `supabase.auth.signInWithOAuth()`: Used in `login/page.tsx`
    - `supabase.auth.admin.listUsers()`: Used in `api/users/route.ts`
    - `supabase.auth.admin.getUserById()`: Used in `api/users/[id]/route.ts`, `userService.ts`
    - `supabase.auth.admin.updateUserById()`: Used in `api/users/[id]/status/route.ts`
    - `supabase.auth.admin.deleteUser()`: Used in `userService.ts`
    - Accessing `localStorage.getItem('supabase.auth.token')`, `localStorage.removeItem('supabase.auth.token')`, `localStorage.removeItem('supabase.auth.code_verifier')`: Used in `login/page.tsx`, `supabase.ts`
  - **Database Operations (CRUD)**:
    - `supabase.from(...).select(...)`: Used in `databaseService.ts`, `check-event.js`, `check-rounds.js`, `list-events.js`, `supabase/migrate-supabase-js.js`, `supabase/check-supabase.js`, `supabase.ts`
    - `supabase.from(...).delete(...)`: Used in `eventService.ts`, `CourseCreationContext.tsx`
    - `supabase.rpc(...)`: Used in `databaseService.ts`, `participants.ts`, `CourseFormContainer.tsx`
  - **Storage**:
    - `supabase.storage.from(...).upload()`: Used in `imageService.ts`
    - `supabase.storage.from(...).getPublicUrl()`: Used in `imageService.ts`
    - `supabase.storage.from(...).remove()`: Used in `imageService.ts`
  - **Client Initialization**:
    - `createClient(...)`: Used in various services (`aiService.ts`, `profileAiService.ts`, `commandHandlers.ts`, `clientAiService.ts`), middleware (`middleware.ts`), components (`UserNotesManager.tsx`, `QuickNotesManager.tsx`, `ProfileFormExample.tsx`), utility files (`auth.ts`, `supabase.ts`), API routes (`api/ai/execute-command/route.ts`, `api/users/email/[email]/route.ts`, `api/users/[id]/route.ts`, `api/ai/process-voice/route.ts`), pages (`events/[id]/scorecard/page.tsx`), scripts (`scripts/create-storage-bucket.js`), and Supabase test/migration files.

### 2. Design API Endpoints & Internal Tool Layer

- **Objective**: Define the high-level API structure for the front-end and the internal tool/service layer for Supabase interactions.
- **Dependencies**: Completion of Supabase dependency identification.
- **Tasks**:
  - Design high-level API endpoints (e.g., `/api/auth/login`, `/api/series`) for front-end consumption.
  - Design an internal tool/service layer (TypeScript functions/classes/modules) that encapsulates direct Supabase calls. These tools *can* accept specific parameters (query details, filters, data).
- **Proposed Design Outline**:

  **A. API Endpoints (for Front-End):**
  *   **Authentication:**
      - `POST /api/auth/login`
      - `POST /api/auth/register`
      - `POST /api/auth/logout`
      - `POST /api/auth/reset-password`
      - `GET /api/auth/session`
      - `GET /api/auth/user`
      - `GET /api/auth/callback`
      - `GET /api/auth/oauth/login?provider={provider}`
  *   **User Profile:**
      - `GET /api/users/me`
      - `PATCH /api/users/me`
  *   **Series:**
      - `GET /api/series`
      - `POST /api/series`
      - `GET /api/series/{id}`
      - `PATCH /api/series/{id}`
      - `DELETE /api/series/{id}`
  *   **Events:**
      - `GET /api/events`
      - `POST /api/events`
      - `GET /api/events/{id}`
      - `PATCH /api/events/{id}`
      - `DELETE /api/events/{id}`
  *   **Courses:**
      - `GET /api/courses`
      - `POST /api/courses`
      - `GET /api/courses/{id}`
      - `PATCH /api/courses/{id}`
      - `DELETE /api/courses/{id}`
  *   **Rounds:**
      - `GET /api/rounds?eventId={id}`
      - `POST /api/rounds`
      - `GET /api/rounds/{id}`
      - `PATCH /api/rounds/{id}`
  *   **Notes:**
      - `GET /api/notes`
      - `POST /api/notes`
      - `GET /api/notes/{id}`
      - `PATCH /api/notes/{id}`
      - `DELETE /api/notes/{id}`
  *   **Storage/Images:**
      - `POST /api/images/upload` (e.g., for profile avatars, course images)
      - `DELETE /api/images` (Requires path/identifier in body/query)
  *   **Admin:**
      - `GET /api/admin/users`
      - `GET /api/admin/users/{id}`
      - `PATCH /api/admin/users/{id}`
      - `DELETE /api/admin/users/{id}`

  **B. Internal Tool/Service Layer (Backend Functions/Methods):**
  *   **Authentication Service (`authService.ts` or similar):**
      - `getSession()`: Wraps `supabase.auth.getSession()`
      - `getUser()`: Wraps `supabase.auth.getUser()`
      - `signInWithPassword(email, password)`: Wraps `supabase.auth.signInWithPassword()`
      - `signUp(email, password, options)`: Wraps `supabase.auth.signUp()`
      - `signOut()`: Wraps `supabase.auth.signOut()`
      - `resetPasswordForEmail(email)`: Wraps `supabase.auth.resetPasswordForEmail()`
      - `updateUser(credentials)`: Wraps `supabase.auth.updateUser()`
      - `refreshSession()`: Wraps `supabase.auth.refreshSession()`
      - `exchangeCodeForSession(code)`: Wraps `supabase.auth.exchangeCodeForSession()`
      - `signInWithOAuth(provider)`: Wraps `supabase.auth.signInWithOAuth()`
      - `adminListUsers(options)`: Wraps `supabase.auth.admin.listUsers()`
      - `adminGetUserById(userId)`: Wraps `supabase.auth.admin.getUserById()`
      - `adminUpdateUserById(userId, attributes)`: Wraps `supabase.auth.admin.updateUserById()`
      - `adminDeleteUser(userId)`: Wraps `supabase.auth.admin.deleteUser()`
  *   **Database Service (`databaseService.ts` or Feature-Specific Services):**
      - `select(table, columns, filters)`: Wraps `supabase.from(table).select(columns).match(filters)...`
      - `insert(table, data)`: Wraps `supabase.from(table).insert(data)`
      - `update(table, data, filters)`: Wraps `supabase.from(table).update(data).match(filters)`
      - `delete(table, filters)`: Wraps `supabase.from(table).delete().match(filters)`
      - `callRpc(functionName, params)`: Wraps `supabase.rpc(functionName, params)`
      - *Possibly more specific tools like `getSeriesById(id)`, `createEvent(eventData)`, etc.* 
  *   **Storage Service (`storageService.ts` or similar):**
      - `upload(bucket, path, file)`: Wraps `supabase.storage.from(bucket).upload(path, file)`
      - `getPublicUrl(bucket, path)`: Wraps `supabase.storage.from(bucket).getPublicUrl(path)`
      - `remove(bucket, paths)`: Wraps `supabase.storage.from(bucket).remove(paths)`

  **Notes:**
  - API endpoints will import and use functions/methods from the internal tool/service layer.
  - The internal tools encapsulate the direct Supabase client interactions.
  - Authentication and authorization logic will be applied within the API endpoints or middleware.
  - Supabase client initialization (`createClient`) will likely be centralized and used by the tool/service layer.

### 3. Implement API Endpoints & Internal Tools

- **Objective**: Develop the API endpoints and the internal tool layer functions/methods.
- **Dependencies**: Completion of API endpoint and tool layer design.
- **Tasks**:
  - Implement the internal tool/service layer functions/methods, ensuring they correctly interact with Supabase.
  - Implement the API route handlers (e.g., in `/src/app/api/...`) which will call the internal tools.
  - Add necessary request validation and error handling.

### 4. Refactor Front-End

- **Objective**: Update the front-end to use the new API endpoints.
- **Dependencies**: Completion of API endpoint and tool layer implementation.
- **Tasks**:
  - Replace direct Supabase calls in front-end components, contexts, and services with calls to the new `/api/...` endpoints.
  - Update data fetching logic (e.g., using `fetch` or libraries like `axios`, `swr`, `react-query`).
  - Test all features thoroughly from the user interface.

### 5. AI Agent Integration (Deferred)

- **Objective**: Integrate an AI agent to interact with the application.
- **Dependencies**: Completion of front-end refactoring.
- **Notes**: This step is deferred. When ready, a separate MCP layer can be built. This MCP layer would likely call the *same internal tool/service layer functions* created in Step 3, providing a consistent interface to Supabase for both the API and the AI agent.

### 6. Testing and Validation

- **Objective**: Conduct comprehensive testing of the API endpoints and front-end integration.
- **Dependencies**: Completion of front-end refactoring.
- **Tasks**:
  - Write unit/integration tests for the API endpoints and internal tools.
  - Perform end-to-end testing of user flows.
  - Gather user feedback for improvements.

### 7. Deployment

- **Objective**: Deploy the updated application in stages.
- **Dependencies**: Successful testing and validation.
- **Tasks**:
  - Deploy to a test/staging environment first.
  - Monitor application performance and logs.
  - Roll out to production.

## Next Steps

- Begin with the implementation of the internal tool/service layer (Step 3a).
- Proceed sequentially through the implementation steps. 