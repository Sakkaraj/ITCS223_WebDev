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
The frontend is automatically served by the backend.

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

### 2. Windows Execution Policy
If `npm` or `nodemon` fails to run scripts:
- Open PowerShell as **Administrator**.
- Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

---

## 📂 Project Architecture

The project follows a modular "Clean Clean" structure, ensuring separation of concerns between backend logic and frontend presentation.

```text
ITCS223_WebDev/
├── sec2_gr14_fe_src/       # 🌐 Frontend Source (Tasks 1 & 4)
│   ├── assets/             # CSS, JS, Images, Partials
│   └── pages/              # HTML templates (Home, Shop, Admin, Search)
│
├── sec2_gr14_ws_src/       # 🏗️ Web Service Source (Task 3)
│   ├── data/               # Persistent storage (SQLite .sqlite file)
│   ├── middleware/         # Auth & validation logic
│   ├── routes/             # API Endpoints (Auth, Products, Cart, etc.)
│   └── server.js           # Core Express application entry
│
├── sec2_gr14_database.sql  # 🗄️ Database Export (Task 2)
├── .env                    # Local environment config
├── package.json            # Base package configuration
└── README.md               # Main project documentation
```

---

## 🎯 Key Feature Catalog

### 💎 Smart Inventory
- **Dynamic Categorization**: The homepage automatically maps furniture to categories with real-time product counts via `/api/products/filter-meta`.
- **Chronological Sorting**: Newer pieces are automatically timestamped and pushed to the top of the "New Products" section.
- **Advanced Search**: Advanced filtering by Category, Material, Color, Dimensions, Weight, and Price Range via the `pages/advance-search.html`.

### 🔐 Secure Administration
- **Full CRUD**: Admins can Create, Read, Update, and Delete products through a secure dashboard (`pages/admin-panel.html`).
- **Image Management**: Support for multiple product views and automatic thumbnail formatting.
- **JWT Authentication**: Secure, token-based access for Admins and Members with persistent logic in `middleware/authMiddleware.js`.

### 🛒 Commerce & Marketing
- **Shopping Cart**: Session-persistent cart allowing quantity updates and color selection.
- **Vat-Inclusive Checkout**: Automated calculation of subtotal, 7% VAT, and final amount during order placement.
- **Functional Newsletter**: Fully integrated sign-up form with database persistence and duplicate prevention.
- **Contact Integration**: Live connection between the Contact Us form and the administrative records.

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
- `GET /api/products` — Retrieve inventory with filtering (category, price, search, etc.).
- `GET /api/products/:id` — Detailed view for a single item (includes images, colors, reviews).
- `GET /api/products/filter-meta` — Get categories, colors, and price ranges for filters.
- `POST /api/products` — **[ADMIN]** Create new furniture.
- `PUT /api/products/:id` — **[ADMIN]** Update existing furniture details.
- `DELETE /api/products/:id` — **[ADMIN]** Remove inventory.

### 🔑 Authentication (`/api/auth`)
- `POST /member/register` — Register a new customer account.
- `POST /member/login` — Customer login (JWT).
- `POST /admin/login` — Administrative login (JWT).
- `GET /me` — Verify current session and retrieve user data.

### 🛒 Commerce (`/api/cart` & `/api/orders`)
- `GET /api/cart` — View current session cart with product details.
- `POST /api/cart` — Add item to cart.
- `PATCH /api/cart/:productId` — Update item quantity in cart.
- `DELETE /api/cart/:productId` — Remove specific item from cart.
- `POST /api/orders` — **[MEMBER]** Place a final order (Checkout).
- `GET /api/orders/my` — **[MEMBER]** View personal order history.

---


*© 2026 BoonSonClon Furniture. Part of the ITCS223 Web Development Course.*
