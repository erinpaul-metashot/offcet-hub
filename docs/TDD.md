# SurplusLink — Technical Design Document
**Version 2.0 | May 18, 2026 | Implemented MVP**

> **Goal:** Ship a working SurplusLink MVP with role-based registration, approval workflows, supplier lot management, admin review and assignment, and real-time assigned feeds.

---

## 1. Technology Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | Next.js 16 App Router + React 19 | Server-rendered route guards and client dashboards |
| Styling | Tailwind CSS 4 | Monochrome, flat, high-contrast UI system |
| Backend / DB | Convex 1.39 | Real-time queries, mutations, file storage |
| Authentication | Better Auth + `@convex-dev/better-auth` | Email/password auth with Convex-backed session tokens |
| Forms / Validation | React Hook Form + Zod | Shared domain validation in `lib/validators.ts` |
| Storage | Convex File Storage | Supplier image upload flow for lot photos |

### Key Auth Decision
- The implementation uses Convex’s Better Auth bridge instead of a hand-rolled JWT/session layer.
- This keeps email/password auth inside the Convex-backed stack while supporting Next.js route handlers and server-side auth utilities cleanly.

---

## 2. Runtime Architecture

### App Routing
- `/` — marketing / product landing page
- `/login` — email/password sign-in
- `/register` — public signup for supplier, buyer, and agent
- `/pending-approval` — status page for pending or rejected users
- `/dashboard` — role redirect
- `/dashboard/supplier`
- `/dashboard/buyer`
- `/dashboard/agent`
- `/dashboard/admin`

### Guard Strategy
- Dashboard routes are protected in server layouts/pages, not middleware.
- Next.js server helpers call authenticated Convex queries before rendering.
- Convex mutations and queries enforce authorization again server-side by role.

### Client / Server Split
- Server components handle auth gating and route redirects.
- Client components handle live Convex queries, forms, uploads, and dashboard interactions.
- Better Auth API routes are exposed through `app/api/auth/[...all]/route.ts`.

---

## 3. Data Model

### Core Tables
```ts
users:
  authUserId, email, name, phone, role, status,
  createdAt, reviewedAt?, reviewedBy?, reviewNotes?

supplierProfiles:
  userId, companyName, taxId, address, warehouseAddress?, goodsTypes[]

buyerProfiles:
  userId, businessName, address, categoriesInterested[]

agentProfiles:
  userId, fullName, businessName?, address,
  serviceDescription?, preferredCategories[]

lots:
  supplierUserId, title, description, category, quantity, unit,
  imageStorageIds[], location, expectedPrice?, status,
  expiresAt, createdAt, updatedAt, reviewedAt?, reviewedBy?, reviewNotes?

assignments:
  lotId, assignedByUserId, assignedToUserId, assignedAt, notes?
```

### Important Modeling Decisions
- `assignments` is the canonical assignment source of truth.
- `lots` does not duplicate assignee arrays.
- Buyer/agent feeds are derived by querying `assignments` and hydrating lot data.
- Lot rejection returns a lot to `draft` with admin review notes so suppliers can revise and resubmit.

### Enums
- `UserRole = supplier | buyer | agent | admin`
- `UserStatus = pending | approved | rejected`
- `LotStatus = draft | pending_review | approved | assigned | sold | expired`

---

## 4. Auth and Onboarding Flow

### Public Registration
1. User fills the role-specific form at `/register`.
2. A Convex action validates the payload with Zod.
3. Better Auth creates the email/password account.
4. Convex creates the matching app user record and role profile.
5. New accounts start with `status: pending`.

### Sign-In
1. User signs in at `/login` with Better Auth email/password.
2. Better Auth issues session cookies and Convex JWT access automatically.
3. Dashboard routes fetch the current authenticated app user.
4. Approved users reach their role dashboard.
5. Pending or rejected users are redirected to `/pending-approval`.

### Admin Provisioning
- Public signup excludes admin.
- A local-development bootstrap action exists to create the first admin account for testing.
- Production admin creation should remain manual and controlled.

---

## 5. Feature Implementation

### Supplier Workflow
- Create new draft lots
- Edit draft lots
- Upload multiple lot images to Convex storage
- Submit drafts for review
- View owned lots with status badges, review notes, and assignment counts
- Mark lots as sold

### Admin Workflow
- Review pending user accounts
- Approve or reject users with optional notes
- Review pending lots
- Approve lots or return them to draft with notes
- Assign approved lots to one or more approved buyers or agents
- View an overview of all lots and assignment counts

### Buyer / Agent Workflow
- Real-time assigned lot feed
- Filter by category/title text
- Filter by location text
- View supplier name, admin assignment note, and lot images

---

## 6. Code Structure

```text
app/
  (auth)/
    login/
    register/
  (dashboard)/
    dashboard/
      supplier/
      buyer/
      agent/
      admin/
  api/auth/[...all]/
  pending-approval/

components/
  login-form.tsx
  register-form.tsx
  supplier-dashboard.tsx
  assigned-lots-dashboard.tsx
  admin-dashboard.tsx
  sign-out-button.tsx
  ui.tsx

convex/
  auth.ts
  auth.config.ts
  http.ts
  schema.ts
  users.ts
  lots.ts
  assignments.ts
  admin.ts

lib/
  auth-client.ts
  auth-server.ts
  dashboard.ts
  utils.ts
  validators.ts

types/
  domain.ts
```

---

## 7. Operational Notes

### Environment
- `.env.local` contains local Convex deployment URLs.
- Convex auth uses:
  - `BETTER_AUTH_SECRET`
  - `SITE_URL`
  - `NEXT_PUBLIC_CONVEX_URL`
  - `NEXT_PUBLIC_CONVEX_SITE_URL`

### Verification
- `npm run lint` passes
- `npm run build` passes

### Development
- Run `npx convex dev --local` for the backend, or `npx convex dev --cloud` for the shared cloud dev deployment
- Run `npm run dev` for the Next.js app
- If no admin exists yet, bootstrap one with the development Convex action before testing the admin dashboard
- Cloud dev bootstrap requires `ADMIN_BOOTSTRAP_TOKEN` in the Convex environment and the same token passed to the action

---

## 8. Deferred Scope

- Payments
- Notifications
- Agent sub-assignment
- Analytics
- Category taxonomy management
- Subscription / commission features
- Middleware-based auth routing

These remain intentionally out of MVP and are not represented in the current implementation.
