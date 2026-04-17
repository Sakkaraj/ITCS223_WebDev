# 🛋️ BoonSonClon — Furniture Store
**68_Section2_Group14**

🚀 **Live Demo**: [https://boonsonclon-furniture.onrender.com](https://boonsonclon-furniture.onrender.com)

BoonSonClon is a high-end, full-stack e-commerce platform designed for premium furniture retail. This repository has been prepared for submission with the required directory structure for Tasks 1, 2, 3, and 4.

---

## 📝 Submission Checklist
- **[x] Tasks 1 & 4 (Front-end Source)**: Located in `sec2_gr14_fe_src/`
- **[x] Task 2 (Database Export)**: Available in `sec2_gr14_database.sql`
- **[x] Task 3 (Web Service Source)**: Located in `sec2_gr14_ws_src/`
- **[x] Team Page**: Located in `sec2_gr14_fe_src/pages/about-us.html` with team member details
- **[x] Test Cases**: Documented in all API route files for Postman testing

---

## 🚀 Quick Start Guide

### # 1. Prerequisites
- **Node.js** (v18+ recommended)
- **Git**

### # 2. Installation & Setup
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

---

## 🖥️ Running the Application (Separate Servers)

### **Option 1: Run Both Servers Together** (recommended for development)
```bash
npm run both
```
This uses `concurrently` to run both frontend and backend servers simultaneously.

- **Frontend**: http://localhost:5000
- **Backend API**: http://localhost:3000/api

---

### **Option 2: Run Servers Separately**

#### **Terminal 1 - Start Backend API Server**
```bash
npm run dev
```
- **Backend runs on**: http://localhost:3000
- **API Endpoints**: http://localhost:3000/api/*

#### **Terminal 2 - Start Frontend Server**
```bash
npm run frontend:dev
```
- **Frontend runs on**: http://localhost:5000
- **Open in browser**: http://localhost:5000

---

### **Option 3: Production Mode**
```bash
# Terminal 1 - Start backend
npm start

# Terminal 2 - Start frontend (in another terminal)
node frontend-server.js
```

---

## 🧪 Testing Web Services with Postman

All API endpoints have **test case documentation** included in the route files.

### **Test Cases Location**
- Authentication: `sec2_gr14_ws_src/routes/auth.js`
- Products (CRUD): `sec2_gr14_ws_src/routes/products.js`
- Cart: `sec2_gr14_ws_src/routes/cart.js`
- Contact: `sec2_gr14_ws_src/routes/contact.js`
- Newsletter: `sec2_gr14_ws_src/routes/newsletter.js`

### **Example: Testing Product Search**
```
Method: GET
URL: http://localhost:3000/api/products?category=Chairs&minPrice=100&maxPrice=500&limit=10
Expected: 200 OK with filtered products
```

### **Example: Testing Product Insert (Admin)**
```
Method: POST
URL: http://localhost:3000/api/products
Headers: { "Authorization": "Bearer <admin_token>" }
Body: {
  "productName": "Modern Coffee Table",
  "categoryId": 4,
  "price": 250.00,
  ...
}
Expected: 201 Created with product ID
```

Each API file contains 2+ test cases per endpoint formatted for easy import into Postman.

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

### 2. Port 5000 Already in Use
If the frontend port is taken, modify the port:
```bash
FRONTEND_PORT=5001 npm run frontend:dev
```

### 3. Windows Execution Policy
If `npm` or `nodemon` fails to run scripts:
- Open PowerShell as **Administrator**.
- Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

### 4. Database Connection Issues
If you get database errors:
1. Delete `/sec2_gr14_ws_src/data/` folder
2. Run `npm run seed` again to reinitialize

### 5. CORS Errors in Browser Console
Ensure both servers are running and the frontend is on port 5000 while backend is on port 3000. The backend has CORS configured for cross-origin requests.

---

## 📂 Project Architecture

The project follows a modular "Clean Architecture" structure, ensuring separation of concerns between backend logic and frontend presentation with separate servers.

```text
ITCS223_WebDev/
├── sec2_gr14_fe_src/       # 🌐 Frontend Source (Tasks 1 & 4)
│   ├── assets/             # CSS, JS, Images, Partials
│   ├── pages/              # HTML templates (Home, Shop, Admin, Team/About-Us)
│   └── index.html          # SPA Entry point
│
├── sec2_gr14_ws_src/       # 🏗️ Backend Web Service (Task 3)
│   ├── data/               # SQLite database storage
│   ├── middleware/         # Auth & validation logic
│   ├── routes/             # API Endpoints with TEST CASES
│   │   ├── auth.js         # Authentication (login, register)
│   │   ├── products.js     # Products CRUD with search filters
│   │   ├── cart.js         # Shopping cart
│   │   ├── contact.js      # Contact form
│   │   ├── newsletter.js   # Newsletter subscription
│   │   └── orders.js       # Order management
│   ├── db.js               # Database connection
│   ├── seed.js             # Database seeding with sample data
│   └── server.js           # Express API server (port 3000, API-only)
│
├── frontend-server.js      # 🖥️ Frontend Static Server (port 5000)
├── sec2_gr14_database.sql  # 🗄️ Database Schema (Task 2)
├── package.json            # Node.js dependencies & scripts
├── .env                    # Environment configuration
└── README.md               # Project documentation
```

---

## 📊 Server Architecture

### **Port Configuration**
- **Frontend Server**: `http://localhost:5000` (Static files, SPA routing)
- **Backend API Server**: `http://localhost:3000/api` (REST API endpoints only)

### **Communication Flow**
```
Browser (http://localhost:5000)
    ↓
Frontend Code (HTML/CSS/JS)
    ↓
Fetch API calls to: http://localhost:3000/api/*
    ↓
Backend Express Server (API Routes)
    ↓
SQLite Database
```

---

## 🔧 Environment Variables

Create a `.env` file in the root directory:
```env
# Backend Server
PORT=3000
JWT_SECRET=your_jwt_secret_key_here
SESSION_SECRET=your_session_secret_here

# Frontend Server
FRONTEND_PORT=5000

# Database
DB_PATH=./sec2_gr14_ws_src/data/boonsonclon.sqlite

# CORS Configuration
CORS_ORIGIN=http://localhost:5000
```

---

## 👥 Team Page

The team page is implemented in `sec2_gr14_fe_src/pages/about-us.html` with the following team members:

- **Sakkarat Tuvajit** (6788140) - Backend Development
- **Jirathiwat Sun** (6788122) - Frontend Development  
- **Radhabhumi Pang** (6788077) - Frontend Development
- **Pipat Suphat** (6788221) - Backend Development
- **Pannakarn Sing** (6788212) - Frontend Development

The page includes member images, roles, and skills.

---

## 📝 Notes

- All API endpoints support JSON request/response format
- Authentication uses JWT tokens stored in `localStorage` as `bsc_token`
- Admin role required for product management endpoints
- Frontend automatically configures API base URL for separate servers
- CORS is enabled for development cross-origin requests

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
