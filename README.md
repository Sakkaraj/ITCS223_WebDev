# 🛋️ BoonSonClon — Premium Furniture Store
**68_Section2_Group14 — ITCS223 Web Development Final Project**

🚀 **Live Production URL**: [https://boonsonclon-furniture.onrender.com](https://boonsonclon-furniture.onrender.com)

BoonSonClon is a high-performance, full-stack e-commerce platform designed for premium furniture retail. This project features a robust **Hybrid Database System** and a fully responsive **Mobile-First Design**.

---

## 🔑 Testing & Grading (Admin Access)
For easier evaluation, use the following credentials to access the Admin Panel and Order Management:

- **Admin Page**: Accessible via the 🛡️ icon in the header or `/pages/admin-panel`
- **Email**: `admin@boonsonclon.com`
- **Password**: `Admin@1234`

---

## 📝 Submission Checklist
- [x] **Task 1 & 4 (Front-end)**: Located in `sec2_gr14_fe_src/`
- [x] **Task 2 (Database Export)**: Master file `sec2_gr14_database.sql` (compatible with both PostgreSQL and SQLite).
- [x] **Task 3 (Web Service)**: Located in `sec2_gr14_ws_src/`
- [x] **Mobile Optimization**: Card-based responsive layout for all viewports (iPhone SE through Desktop).
- [x] **Clean URLs**: Server-side support for clean paths (e.g., `/pages/shop` instead of `shop.html`).

---

## 🚀 Quick Start (Local Development)

### 1. Installation
```bash
npm install
```

### 2. Run Development Servers
```bash
# Runs both API (Port 3000) and Frontend (Port 5000) simultaneously
npm run both
```
- **Storefront**: [http://localhost:5000](http://localhost:5000)
- **API Reference**: [http://localhost:3000/api](http://localhost:3000/api)

> [!TIP]
> **Mobile Testing**: You can test the site on your physical phone by visiting your computer's IP address (e.g. `http://192.168.1.5:5000`). The API will automatically route correctly!

---

## ☁️ Deployment Guide (Render.com)

This project is pre-configured for **Render.com** with a silent build process and production-ready sessions.

1.  **Database**: Create a **New -> PostgreSQL** database on Render and copy the **Internal Database URL**.
2.  **Web Service**: Create a **New -> Web Service** and connect this repository.
3.  **Environment Settings**:
    - **Build Command**: `npm run build`
    - **Start Command**: `npm run render:start`
    - **Environment Variables**:
        - `DATABASE_URL`: (Your Internal Database URL)
        - `NODE_ENV`: `production`
        - `SESSION_SECRET`: (Any random string for session security)
        - `JWT_SECRET`: (A long random string for token security)

---

## 🛡️ Database Architecture
We utilize a dual-database approach to ensure zero-config grading while providing production persistence:
- **Local (SQLite)**: The app translates the master SQL schema on-the-fly. No DB installation is required for local testing.
- **Production (PostgreSQL)**: Connected via Render. Our seeding engine is **Idempotent**; it will skip re-seeding if data exists, keeping your production orders and users safe across restarts.

---

## 📂 Project Structure
```text
ITCS223_WebDev/
├── sec2_gr14_fe_src/       # 🌐 Frontend Source (HTML/CSS/JS)
├── sec2_gr14_ws_src/       # 🏗️ Backend Web Service 
│   ├── routes/             # API Endpoints
│   ├── db.js               # Universal DB Bridge (SQLite <-> Postgres)
│   ├── seed.js             # Safe Idempotent Seeding Engine
│   └── server.js           # Production Unified Server
├── sec2_gr14_database.sql   # 🗄️ Master Database Schema (Postgres Format)
└── package.json            # Deployment Scripts & Dependencies
```

---

## 👥 The Team
**Section 2 — Group 14**
- **Sakkarat Tuvajit** (6788140)
- **Jirathiwat Sun** (6788122)
- **Radhabhumi Pang** (6788077)
- **Pipat Suphat** (6788221)
- **Pannakarn Sing** (6788212)

---

*© 2026 BoonSonClon Furniture. Part of the ITCS223 Web Development Course.*
