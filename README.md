# 🛋️ BoonSonClon — Premium Furniture Store
**68_Section2_Group14 — ITCS223 Web Development Final Project**

🚀 **Live Production URL**: [https://boonsonclon-furniture.onrender.com](https://boonsonclon-furniture.onrender.com)

BoonSonClon is a high-performance, full-stack e-commerce platform designed for premium furniture retail. This project features a robust **Hybrid Database System** optimized for both easy local development and reliable production hosting.

---

## 📝 Submission Checklist
- **[x] Task 1 & 4 (Front-end)**: Located in `sec2_gr14_fe_src/`
- **[x] Task 2 (Database Export)**: Single master file `sec2_gr14_database.sql` (Postgres & SQLite compatible).
- **[x] Task 3 (Web Service)**: Located in `sec2_gr14_ws_src/`
- **[x] Team Page**: Accessible via `/pages/about-us`

---

## 🚀 Quick Start (Local Development)

### 1. Installation
```bash
npm install
```

### 2. Initialize Local Database
This script automatically detects your environment. Locally, it will use **SQLite** and translate the master SQL schema on-the-fly.
```bash
npm run seed
```

### 3. Run Development Servers
```bash
# Runs both API (Port 3000) and Frontend (Port 5000) simultaneously
npm run both
```
- **Storefront**: [http://localhost:5000](http://localhost:5000)
- **API Reference**: [http://localhost:3000/api](http://localhost:3000/api)

---

## ☁️ Deployment Guide (Render.com)

This project is pre-configured for **Render.com** with support for PostgreSQL.

1.  **Create a PostgreSQL Database**: Create a **New -> PostgreSQL** database on Render and copy the **Internal Database URL**.
2.  **Create a Web Service**: Create a **New -> Web Service** and connect this GitHub repository.
3.  **Configure Environment**:
    - **Build Command**: `npm run build`
    - **Start Command**: `npm run render:start`
    - **Add Environment Variables**:
        - `DATABASE_URL`: (Paste your Internal Database URL here)
        - `SERVE_FRONTEND`: `true`
        - `SESSION_SECRET`: (Any random string)

---

## 🛡️ Hybrid Database Strategy
To ensure the best experience for both developers and users, we utilize a dual-database approach:
- **Local (Offline)**: Uses **SQLite**. This allows the project to run immediately on any computer with zero configuration. No database installation is required for grading.
- **Cloud (Production)**: Uses **PostgreSQL**. When deployed to Render, the app automatically connects to a professional cloud database to ensure your orders and account data are **permanently saved**.

---

## 📂 Project Structure
```text
ITCS223_WebDev/
├── sec2_gr14_fe_src/       # 🌐 Frontend Source (HTML/CSS/JS)
│   └── frontend-server.js  # 🖥️ Local Dev Server (Port 5000)
├── sec2_gr14_ws_src/       # 🏗️ Backend Web Service 
│   ├── routes/             # API Endpoints (with Postman Test Cases)
│   ├── db.js               # Universal DB Bridge (SQLite <-> Postgres)
│   ├── seed.js             # Smart Seeding (with SQL translation engine)
│   └── server.js           # Production Server
├── sec2_gr14_database.sql  # 🗄️ Master Database Schema
├── package.json            # Scripts & Dependencies
└── .env                    # Environment Config (Local)
```

---

## 👥 The Team
**Section 2 — Group 14**
- **Sakkarat Tuvajit** (6788140) — Backend & Database
- **Jirathiwat Sun** (6788122) — Frontend & Architecture  
- **Radhabhumi Pang** (6788077) — UI/UX Design
- **Pipat Suphat** (6788221) — Backend Development
- **Pannakarn Sing** (6788212) — Frontend Development

---

*© 2026 BoonSonClon Furniture. Part of the ITCS223 Web Development Course.*
