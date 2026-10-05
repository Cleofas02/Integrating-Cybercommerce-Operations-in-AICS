# AICS Canteen — Cybercommerce Platform
> **Integrating Cybercommerce Operations in Asian Institute of Computer Studies (AICS) Commonwealth**  
> A mission-critical, queue-reducing school canteen pre-ordering and digital counter verification platform.

---

## 🎯 Executive Summary & Purpose

In campus canteen environments, peak recess and lunch periods lead to prolonged queues, transaction bottlenecks, meal preparation delays, and cash handling disputes. 

The **AICS Canteen Cybercommerce Platform** digitizes counter transactions by decoupling **meal selection and scheduling** from **order preparation and cash settlement**:
- **Students** browse live menus, schedule designated claim windows (Recess, Lunch, After Class), and receive tamper-proof digital claim tickets.
- **Canteen Staff / Admins** leverage an order management dashboard with real-time sales telemetry, queue prioritization, and two-factor dual-validation ticket redemption.
- **Campus Impact**: Eliminates counter congestion, accelerates pickup times, ensures zero pricing discrepancies, and gives canteen management full auditability over daily operations.

---

## 📸 Product Preview & Interface

| Student Pre-Ordering & Digital Claim Ticket | Canteen Staff Operations & Dual-Key Terminal |
| :---: | :---: |
| *Live menu catalog, pickup scheduling & tamper-proof claim token* | *Real-time revenue telemetry, fulfillment queue & secure redemption* |

---

## ✨ Core Product Capabilities & Importance

### 1. Student Experience & Self-Service Ordering
* **Real-Time Digital Menu**: Dynamic catalog filtered by categorized offerings (*Meals, Snacks, Drinks, Events & Fees*). Inactive or archived items are automatically suppressed.
* **Scheduled Pickup Slots**: Pre-scheduled collection windows (*Recess, Lunch, After Class*) enable the canteen staff to batch preparations ahead of rush periods.
* **Digital Claim Tickets**: Instant generation of serialized ticket identifiers (`ORD-XXXX`) accompanied by a secure 6-digit reference token.
* **Live Order Lifecycle Tracking**: Transparent status transitions (`Preparing` ➔ `Ready` ➔ `Claimed`).

### 2. Canteen Admin Operations & Fulfillment
* **Live Telemetry & Analytics Dashboard**:
  - Real-time monitors for **Today's Gross Sales**, **Total Orders**, **Claimed Count**, and **Pending Fulfillment Queue**.
  - 7-day rolling revenue trend visualization for inventory and staffing optimization.
  - Auto-refreshing poll cycles (15s cadence) to maintain live kitchen readiness.
* **Streamlined Order Queue Management**:
  - Quick action status transitions (`Mark Ready`).
  - Safe archival removals of fulfilled tickets that preserve underlying financial and sales audit records.
* **Dynamic Menu & Inventory Control**:
  - Instant pricing and availability toggles.
  - Non-destructive soft-delete (archival) mechanisms preserving historical references across past student orders.

### 3. Dual-Key Counter Verification System
* **Counter Fraud Prevention**: To redeem a ticket, admins input both the **Ticket Code** (`ORD-XXXX`) and the confidential **6-Digit Reference Number**.
* **Zero Admin-Side Leakage**: The 6-digit reference number is stored securely and issued *only* to the student's authenticated session—preventing counter staff or bystanders from claiming tickets without customer presentation.
* **Atomic Single-Claim Guarantee**: Each order can only be claimed once; re-submission attempts are rejected atomically.

---

## 🔒 Security Architecture & Data Integrity

| Security Pillar | Implementation & Importance |
| :--- | :--- |
| **Server-Authoritative Pricing** | The client passes only item IDs and quantities. Prices and line totals are strictly calculated from the database on the server, guaranteeing that client-side payload tampering cannot manipulate billing totals. |
| **HttpOnly Cookie Authentication** | Stateless JSON Web Tokens (JWT) signed with HMAC-SHA256 (`jose`) and transmitted exclusively via `HttpOnly`, `SameSite=Lax` cookies, neutralizing Cross-Site Scripting (XSS) token theft. |
| **Credential Protection** | Student and administrative passwords hashed with `bcryptjs` using adaptive salt rounds. |
| **Role-Based Access Control (RBAC)** | Administrative endpoints (`/api/admin-*`, `/api/verify-ticket`) enforce explicit role validation prior to processing queries. |
| **SQL Injection Defense** | All database transactions utilize parameterized SQL queries via `@neondatabase/serverless`. |
| **Discrepancy-Free Error Responses** | Failed verification attempts return unified generic rejections, mitigating enumeration or brute-force timing attacks. |

---

## 🏗️ Technical Architecture

```mermaid
graph TD
    A[Student / Admin Client<br/>React + Vite + Tailwind] -->|HTTPS Requests / HttpOnly Cookies| B[Vercel Serverless Functions<br/>Node.js Runtime / API Layer]
    B -->|Connection Pool / SSL| C[(Neon PostgreSQL<br/>AWS Singapore Region)]
    
    subgraph Client Application
        A1[Catalog & Cart]
        A2[Tickets & Real-time Status]
        A3[Admin Operations Dashboard]
    end

    subgraph Serverless API Endpoints
        B1[Auth: login / register / logout / me]
        B2[Menu: catalog / admin-menu]
        B3[Orders: orders / admin-orders / verify-ticket]
    end

    subgraph Relational Database
        C1[users]
        C2[menu_items]
        C3[orders & order_items]
    end
```

### Technology Stack
* **Frontend UI**: React 18, Vite, React Router 6, Tailwind CSS 4
* **Backend Runtime**: Vercel Serverless Functions (Node.js 24 runtime)
* **Local Development Engine**: Node.js custom dev server (`dev-api.js`)
* **Database Layer**: Neon Serverless PostgreSQL (Singapore Region - AWS `ap-southeast-1`)
* **Cryptographic Libraries**: `jose` (JWT signing & verification), `bcryptjs` (secure password hashing)

---

## 🗄️ Database Architecture

The schema maintains financial immutability and historical accuracy:

```
users
├── id (PK, SERIAL)
├── name (VARCHAR)
├── email (VARCHAR, UNIQUE)
├── password_hash (VARCHAR)
├── role ('student' | 'admin')
└── created_at (TIMESTAMP)

menu_items
├── id (PK, SERIAL)
├── name (VARCHAR)
├── category (VARCHAR) -- Meals, Snacks, Drinks, Events & Fees
├── price (NUMERIC)
├── is_available (BOOLEAN)
├── emoji (VARCHAR)
├── archived (BOOLEAN)
└── created_at (TIMESTAMP)

orders
├── id (PK, SERIAL)
├── code (VARCHAR, UNIQUE) -- e.g., 'ORD-1001' via order_code_seq
├── user_id (FK -> users.id)
├── pickup_time (VARCHAR) -- Recess, Lunch, After class
├── payment_method (VARCHAR) -- 'Cash at the counter'
├── total (NUMERIC)
├── status (VARCHAR) -- 'Preparing', 'Ready', 'Claimed'
├── reference_no (VARCHAR, UNIQUE) -- 6-digit confidential claim code
├── removed (BOOLEAN) -- Soft-removal from active admin lists
├── created_at (TIMESTAMP)
└── claimed_at (TIMESTAMP)

order_items
├── id (PK, SERIAL)
├── order_id (FK -> orders.id)
├── menu_item_id (FK -> menu_items.id)
├── quantity (INTEGER)
└── unit_price (NUMERIC) -- Snapshot price at exact moment of checkout
```

---

## 📡 API Reference Matrix

| Route | Method | Access Level | Description |
| :--- | :---: | :---: | :--- |
| `/api/register` | `POST` | Public | Account creation (defaults strictly to `student` role) |
| `/api/login` | `POST` | Public | Authenticates credentials and sets secure `HttpOnly` JWT cookie |
| `/api/logout` | `POST` | Authenticated | Clears user session token |
| `/api/me` | `GET` | Authenticated | Retrieves current authenticated session details |
| `/api/menu` | `GET` | Authenticated | Returns active, available menu items |
| `/api/orders` | `GET` | Student | Lists historical and active tickets belonging to the session |
| `/api/orders` | `POST` | Student | Places an order, calculates total on server, generates reference token |
| `/api/admin-menu` | `POST` | Admin | Creates a new catalog item |
| `/api/admin-menu` | `PUT` | Admin | Updates item attributes, price, or availability |
| `/api/admin-menu` | `DELETE`| Admin | Performs soft-delete (`archived = true`) to protect historical orders |
| `/api/admin-orders`| `GET` | Admin | Retrieves operational statistics and active/claimed order lists |
| `/api/admin-orders`| `PUT` | Admin | Updates order state (e.g., transition `Preparing` ➔ `Ready`) |
| `/api/admin-orders`| `DELETE`| Admin | Flags claimed order as hidden from the active display list |
| `/api/verify-ticket`| `POST` | Admin | Verifies dual-key (`code` + `reference_no`) and transitions to `Claimed` |

---

## 🚀 Setup & Local Execution Guide

### 1. Prerequisites
- **Node.js**: Version `24.x`
- **PostgreSQL / Neon Account**: Dedicated database instance

### 2. Environment Configuration
Create a `.env.local` file in the project root:
```env
DATABASE_URL="postgres://user:password@ep-sample-pooler.ap-southeast-1.aws.neon.tech/cybercommerce?sslmode=require"
JWT_SECRET="generate-a-secure-random-64-character-hex-string"
```

### 3. Database Initialization
Execute the SQL migration manifests in sequence within the Neon SQL console:
1. `db/schema.sql` & `db/seed.sql`
2. `db/migration-01-menu.sql`
3. `db/migration-02-orders.sql`

### 4. Running the Development Environment
Due to platform-specific serverless emulation constraints on Windows, the application uses a dual-process architecture during development:

```powershell
# Terminal 1: Launch Backend API Server (Port 3001)
npm run api

# Terminal 2: Launch Frontend Client (Port 5173)
npm run dev
```

### 5. Production Build & Deployment
```powershell
# Production build validation
npm run build

# Deploy directly to Vercel Production
npx vercel --prod
```

---

## 📈 Future Product Roadmap

- [ ] **Push & SMS Notifications**: Automated alerts to student devices when tickets transition to `Ready`.
- [ ] **Stock & Inventory Auto-Depletion**: Real-time stock counts with automated cutoff flags when stock reaches zero.
- [ ] **Product Sales & Margin Reporting**: Granular reporting on top-selling items and gross margins per service window.
- [ ] **Self-Service Password Recovery**: Secure tokenized password reset flows.
- [ ] **Digital School Wallet Integration**: Hybrid payment gateway allowing direct student debit card integration alongside cash.
