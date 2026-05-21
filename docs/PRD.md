# SurplusLink — Product Requirements Document
**Version 1.1 | May 2026 | MVP Scope**

> **One-Liner:** SurplusLink is a curated B2B marketplace that turns suppliers' excess inventory into instant opportunities for buyers and agents.

---

## 1. Problem & Core Idea

Businesses of all kinds generate surplus or excess inventory — unused raw materials, overstock components, leftover packaging, or any other goods that are taking up space and tying up capital. On the other side, smaller buyers and fabricators need affordable access to such materials but lack direct relationships or sufficient volume to approach large suppliers.

Today this gap is bridged by informal brokers with zero transparency, no trust infrastructure, and massive inefficiency. SurplusLink creates a lightly curated, trust-first matching layer:

- Suppliers list surplus lots (any category of goods or materials).
- Admins review and assign lots to verified buyers or agents.
- Introductions are made; deals close off-platform initially.
- Everyone wins: suppliers clear stock, buyers access deals, agents earn margin, platform earns future commission.

This is **not** a full marketplace with integrated payments (MVP scope — reduces regulatory burden). It is a **discovery and trusted introduction platform** with manual quality control via admins in the early days.

---

## 2. User Roles & Value Propositions

### 2.1 Supplier
Any business with surplus goods — could be a manufacturer, distributor, or warehouse operator.

- Upload excess lots quickly: photos, specs, quantity, location, expected price.
- Clear stock without dedicated marketing effort.
- **Signup fields:** Company name, business registration / tax ID, contact person, full address (for verification), types of goods they deal in.

### 2.2 Buyer / Shop
Small to medium businesses that need affordable access to goods they don't normally source directly.

- View only lots assigned to them by admin.
- Browse quality-controlled inventory at attractive prices.
- **Signup fields:** Business name, full address, categories of interest, contact.

### 2.3 Agent / Middleman
Independent brokers or aggregators who act as a distribution layer between suppliers and buyers.

- Receive assigned bulk lots from suppliers.
- Connect lots to their network of buyers (sub-assignment is a post-MVP feature).
- **Signup fields:** Full name, business name (optional), full address, service description, contact.

### 2.4 Admin
The platform operations team.

- Reviews and approves all user registrations.
- Reviews all lot listings for accuracy and quality.
- Manually assigns lots to buyers or agents.
- Monitors platform activity.

---

## 3. MVP Feature Scope

### 3.1 Goals
- Role-based authentication and onboarding.
- Lot listing, admin review, and assignment workflow.
- Role-specific dashboards and feeds.
- No integrated payments; no automated matching.

### 3.2 Key Screens & Flows

#### Onboarding
- Role selection screen on signup.
- Role-specific registration form (different fields per role).
- All accounts enter a `pending` state and require manual admin approval before access is granted.

#### Dashboards (role-specific)

| Role | Dashboard Content |
|------|-------------------|
| Supplier | My Lots (with status badges), Create New Lot button |
| Buyer / Shop | Lots assigned to me, search & filter |
| Agent | Lots assigned to me, search & filter |
| Admin | Pending users, pending lots, assignment panel, all lots overview |

#### Lot Creation (Supplier)
- Fields: Title, Description, Category (free-text), Quantity & Unit, Photos (multiple), Location (full address), Expected Price, Expiry Date.
- Submitted lots enter `pending_review` status.

#### Admin Review & Assignment
- Admin sees a queue of pending lots.
- Can approve or reject with optional notes.
- Assigns approved lots to one or more buyers or agents.

#### Assigned Lots Feed
- Buyers and agents see only lots assigned to them.
- Real-time updates when new lots are assigned.
- Filter by category, location.

#### Lot Status Lifecycle

| Status | Who Sets It | Meaning |
|--------|-------------|---------|
| `draft` | Supplier | Saved but not yet submitted |
| `pending_review` | Supplier (on submit) | Awaiting admin review |
| `approved` | Admin | Reviewed and approved, not yet assigned |
| `assigned` | Admin | Assigned to at least one buyer or agent |
| `sold` | Supplier | Supplier marks deal as closed |
| `expired` | System / Admin | Past expiry date or manually expired |

#### Profile Management
- All users can view and edit their profile.
- Address and contact info editable; role changes not allowed post-signup.

---

## 4. Data Model

Location is stored as a full address string for all entities to support verification and geographic context.

```
users              id, email, name, phone, role, status, createdAt

supplierProfiles   userId, companyName, taxId, address (full),
                   warehouseAddress?, goodsTypes[]

buyerProfiles      userId, businessName, address (full),
                   categoriesInterested[]

agentProfiles      userId, fullName, businessName?, address (full),
                   serviceDescription?, preferredCategories[]

lots               supplierId, title, description, category (free-text),
                   quantity, unit, images[], location (full address),
                   expectedPrice?, status, assignedTo[], expiresAt, createdAt

assignments        lotId, assignedBy (adminId), assignedTo (userId),
                   assignedAt, notes?
```

---

## 5. Post-MVP Roadmap

| Feature | Notes |
|---------|-------|
| Agent sub-assignment | Agent assigns sub-lots to their buyer network |
| Deal closure tracking | Track deal progress and closed value |
| In-app notifications | New assignment alerts, status changes |
| Email / SMS / external alerts | Notification delivery channels |
| Auto-matching suggestions | AI-assisted lot-to-buyer matching for admins |
| Ratings & reviews | Post-deal feedback between parties |
| Analytics for suppliers | Stock turnover, assignment rates |
| Subscription tiers | Premium access for buyers, featured listings for suppliers |
| Logistics integration | Coordinate transport for closed deals |
| Commission tracking | Platform fee on closed deals |
| Admin-managed categories | Admin can create/edit category taxonomy |

---

## 6. Analysis & Risks

### Strengths
- Universal problem — excess inventory exists across all industries and geographies.
- Manual admin assignment = high trust and quality control in early days.
- Off-platform transactions mean faster launch and less regulatory exposure.
- Agent role cleverly integrates existing informal broker networks.
- Fully general: not locked into any specific material type or industry.

### Risks & Open Questions
- Will suppliers upload consistently? Requires strong onboarding and early incentives.
- How to acquire buyers in target clusters? Consider direct outreach or partner channel.
- Admin scalability: who handles assignments at launch? Needs a clear ops plan.
- Agent flow is limited in MVP (no sub-assignment) — communication plan needed.

### Monetization Path (Post-MVP)
- Commission on closed deals (tracked manually first, then automated).
- Premium subscriptions for suppliers (featured listings) or buyers (priority access).
- Logistics and fulfilment partnerships.