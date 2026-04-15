# BoonSonClon Furniture Store

A premium full-stack e-commerce furniture shopping application built with Node.js, Express, and SQLite.

## 🚀 Quick Start Instructions

Follow these steps to get the server up and running on your local machine:

1. **Install Dependencies** (Required first time):
   ```bash
   npm install
   ```

2. **Setup Environment**:
   Ensure you have a `.env` file in the root directory (copy from `.env.example` if needed).

3. **Initialize Database**:
   If you are starting fresh or need to reset the inventory:
   ```bash
   npm run seed
   ```

4. **Start the Server**:
   ```bash
   npm start
   ```
   The server will be available at **`http://localhost:3000`**.

---

## 📂 Project Structure

This project follows a strict hierarchy to maintain code clarity and separation of concerns.

```
boonsonclon-furniture/
├── public/                 # Frontend (Client-side)
│   ├── assets/             # Images, CSS, and JS
│   │   ├── css/            # Style sheets (modular)
│   │   └── js/             # Page logic (modular)
│   └── pages/              # HTML documents
│
├── server/                 # Backend (Server-side)
│   ├── data/               # Persistent storage (SQLite DB)
│   ├── middleware/         # Security & Auth logic
│   ├── routes/             # API Endpoints
│   ├── db.js               # Database connection logic
│   └── server.js           # Main application entry
│
├── tools/                  # Developer utilities & test scripts
├── .env                    # Environment configuration
└── README.md               # You are here
```

---

## 🛠 Available Scripts

In the project directory, you can run:

| Command | Description |
|---------|-------------|
| `npm start` | Runs the server in production mode. |
| `npm run dev` | Runs the server with **nodemon** (auto-restarts on changes). |
| `npm run seed` | Re-initializes the database with default inventory and admin accounts. |

---

## 🎯 Key Features

- **Dynamic Shop**: Real-time product counts and chronological sorting for new arrivals.
- **Admin Panel**: Full CRUD (Create, Read, Update, Delete) capabilities for product management.
- **Interactive Maps**: Live Google Maps integration for store location.
- **Newsletter**: Fully functional subscription system with database persistence.
- **Responsive UI**: Premium, high-end design optimized for all screen sizes.

---

## 💻 Tech Stack

- **Frontend**: HTML5, Vanilla CSS, JavaScript, Lucide Icons.
- **Backend**: Node.js, Express.js.
- **Database**: SQLite (file-based, no external setup required).
- **Security**: JWT (JSON Web Tokens) and bcrypt password hashing.

---

## 📋 API Overview

- `GET /api/products`: Fetch all inventory.
- `POST /api/auth/login`: Admin and member authentication.
- `POST /api/newsletter`: Subscribe to updates.
- `POST /api/contact`: Send inquiries to the store.

---

*This project is part of the ITCS223 Web Development course.*
# Deployment

To deploy this application:

1. Set `NODE_ENV=production`
2. Use proper environment variables in production
3. Consider using a process manager like PM2
4. Set up a reverse proxy (nginx/Apache)
5. Enable HTTPS

## Support

For issues or questions, please check the project documentation or contact the development team.

## License

This project is part of ITCS223 Web Development course.
