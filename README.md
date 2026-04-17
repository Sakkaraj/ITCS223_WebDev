# 🛋️ BoonSonClon — Furniture Store
**68_Section2_Group14**

BoonSonClon is a high-end, full-stack e-commerce platform designed for premium furniture retail. This repository has been prepared for submission with the required directory structure for Tasks 1, 2, 3, and 4.

---

## 📝 Submission Checklist
- **[x] Tasks 1 & 4 (Front-end Source)**: Located in `sec2_gr14_fe_src/`
- **[x] Task 2 (Database Export)**: Available in `sec2_gr14_database.sql`
- **[x] Task 3 (Web Service Source)**: Located in `sec2_gr14_ws_src/`

---

## 🚀 Quick Start Guide

# 1. Prerequisites
- **Node.js** (v18+ recommended)
- **Git**

# 2. Installation & Setup
```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables
cp .env.example .env

# 3. Initialize Database
# This command creates the /data folder inside the web service directory and seeds it.
npm run seed
```

This project uses a file-based SQLite database. To seed the initial data (Furniture, Categories, Admin account):
```bash
npm run seed
```

### 4. Run the Application
```bash
# Development Mode (with auto-restart)
npm run dev

# Production Mode
npm start
```
Default Entry: **`http://localhost:3000`**

---

## 🆘 Troubleshooting & Common Fixes

### 1. Port 3000 Already in Use (`EADDRINUSE`)
If you see this error, another process is already using port 3000. 

**On Windows (PowerShell):**
```powershell
# Identify the process (PID) using port 3000
netstat -ano | findstr :3000

# Stop the process (Replace <PID> with the actual number from the command above)
taskkill /F /PID <PID>
```

**On Mac/Linux:**
```bash
# Find and stop the process
lsof -ti:3000 | xargs kill -9
```

### 2. SQLite Connection Errors (`SQLITE_CANTOPEN`)
This usually occurs if the data directory is missing or locked.
- **Auto-Fix**: The latest code in `db.js` now automatically creates the `/server/data` folder for you.
- **Manual Fix**: Simply run `npm run seed` again to initialize the database and folders correctly.

### 3. Windows Execution Policy
If `npm` or `nodemon` fails to run scripts:
- Open PowerShell as **Administrator**.
- Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

---

## 📂 Project Architecture

The project follows a modular "Clean Clean" structure, ensuring separation of concerns between backend logic and frontend presentation.

```text
ITCS223_WebDev/
├── sec2_gr14_fe_src/       # 🌐 Frontend Source (Tasks 1 & 4)
│   ├── assets/             # Shared resources (CSS, JS, Images)
│   └── pages/              # HTML templates
│
├── sec2_gr14_ws_src/       # 🏗️ Web Service Source (Task 3)
│   ├── data/               # Persistent storage (SQLite)
│   ├── routes/             # API Endpoints
│   └── server.js           # Core Express application
│
├── sec2_gr14_database.sql  # 🗄️ Database Export (Task 2)
├── .env                    # Environment variables
├── package.json            # Project configuration
└── README.md               # This documentation
```

---

## 🎯 Key Feature Catalog

### 💎 Smart Inventory
- **Dynamic Categorization**: The homepage automatically maps furniture to categories with real-time product counts.
- **Chronological Sorting**: Newer pieces are automatically timestamped and pushed to the top of the "New Products" section.
- **Smart Search**: Advanced filtering by Category, Material, and Price Range.

### 🔐 Secure Administration
- **Full CRUD**: Admins can Create, Read, Update, and Delete products through a secure dashboard.
- **Image Management**: Support for multiple product views and thumbnail generation.
- **JWT Authentication**: Secure, token-based access for Admins and Members.

### ✉️ Interactive Marketing
- **Functional Newsletter**: Fully integrated sign-up form with database persistence and duplicate prevention.
- **Contact Integration**: Live connection between the Contact Us form and the administrative inbox.
- **Live Maps**: Interactive Google Maps integration for physical store discovery.

---

## 🗄️ Database Schema (SQLite)

The system utilizes 16 integrated tables to manage every aspect of the store.

| Table Name | Primary Role |
|------------|--------------|
| `Product` | Core furniture data (dimensions, price, weight, timestamps). |
| `Category` | Dynamic product grouping (Chairs, Tables, Sofas, etc.). |
| `Image` | Mapping multiple high-res assets to individual products. |
| `Color` / `ProductColor` | Enabling multi-variant furniture selection. |
| `AdminInformation` | Secure profile data for store managers. |
| `AdminLoginInformation`| Credentials storage (Bcrypt hashed) with Role-based access. |
| `Member` | Customer profile management. |
| `NewsLetterSubscriber`| Email list for marketing automation. |
| `Orders` / `OrderItem` | Transactional history and fulfillment tracking. |

---

## 🔌 API Reference

### 🛋️ Products
- `GET /api/products` — Retrieve all inventory (supports pagination & sorting).
- `GET /api/products/:id` — Detailed view for a single item.
- `POST /api/products` — [ADMIN] Create new furniture.
- `DELETE /api/products/:id` — [ADMIN] Remove inventory.

### 🔑 Authentication
- `POST /api/auth/member/login` — Customer access.
- `POST /api/auth/admin/login` — Administrative access.
- `GET /api/auth/me` — Verify current session/JWT.

### 🛒 Commerce
- `GET /api/cart` — View current session cart.
- `POST /api/cart` — Add item to cart.
- `POST /api/newsletter` — Subscribe to updates.

---

## 🛠️ Advanced Troubleshooting

### **Port 3000 Conflict**
If you see `EADDRINUSE`, the port is already occupied.
**Fix (Windows):**
```powershell
netstat -ano | findstr :3000
taskkill /F /PID <ActualPID>
```

### **Windows Script Error (Execution Policy)**
If `npm` or `nodemon` fails to load:
**Fix:** Open PowerShell as Administrator and run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 👨‍💻 Developer Support
All development help scripts are located in the `/tools` directory.
- `tools/db-verify.js` — Audits the current database integrity.
- `tools/update_products.js` — Batch update utility for inventory.

---

*© 2024 BoonSonClon Furniture. Part of the ITCS223 Web Development Course.*
