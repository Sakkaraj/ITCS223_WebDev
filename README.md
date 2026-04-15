# 🛋️ BoonSonClon — Furniture Store
### *Where Traditional Meets Modern*

BoonSonClon is a high-end, full-stack e-commerce platform designed for premium furniture retail. Built with a robust Node.js backend and a sleek, responsive frontend, it provides a seamless shopping experience from discovery to checkout.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **Git**
- **A terminal with script execution enabled** (e.g., PowerShell as Admin on Windows)

### 2. First-Time Setup
```bash
# 1. Clone the repository
git clone https://github.com/Sakkaraj/ITCS223_WebDev.git
cd ITCS223_WebDev

# 2. Install dependencies
npm install

# 3. Setup local environment
cp .env.example .env

# 4. Initialize the Data Directory & Database
# This command will automatically create the /server/data folder and seed the inventory.
npm run seed
```

### 3. Database Initialization
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

## 📂 Project Architecture

The project follows a modular "Clean Clean" structure, ensuring separation of concerns between backend logic and frontend presentation.

```text
ITCS223_WebDev/
├── public/                 # 🌐 Frontend (Client-side)
│   ├── assets/             # Shared resources
│   │   ├── css/            # Modular stylesheets (style.css, header.css, etc.)
│   │   ├── js/             # Page logic (shop.js, api.js, layout.js)
│   │   └── images/         # Optimized product & UI assets
│   └── pages/              # HTML templates
│
├── server/                 # 🏗️ Backend (Server-side)
│   ├── data/               # Persistent storage (database.sqlite)
│   ├── middleware/         # Security (Auth, JWT verification)
│   ├── routes/             # RESTful API Endpoints
│   ├── db.js               # Database connection & pooling
│   └── server.js           # Core Express application
│
├── tools/                  # 🛠️ Dev Tools (Tests, DB Audit, Migrations)
├── .env                    # Environment variables
└── README.md               # Documentation
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
