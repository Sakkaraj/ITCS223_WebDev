# BoonSonClon Furniture Store

A full-stack e-commerce furniture shopping application built with Node.js, Express, and SQLite.

## Project Structure

```
boonsonclon-furniture/
├── public/                     # Static files served to clients
│   ├── index.html             # Landing page
│   ├── assets/                # Frontend assets
│   │   ├── css/              # Stylesheets
│   │   │   ├── header.css
│   │   │   ├── footer.css
│   │   │   ├── home.css
│   │   │   ├── shop.css
│   │   │   ├── product.css
│   │   │   └── [other page styles]
│   │   ├── js/               # JavaScript files
│   │   │   ├── api.js        # API client
│   │   │   ├── layout.js     # Layout utilities
│   │   │   ├── auth.js       # Authentication
│   │   │   └── [page scripts]
│   │   └── images/           # Product and media images
│   │       ├── best-seller/
│   │       ├── new-product/
│   │       └── [product images]
│   └── pages/                 # HTML pages
│       ├── home.html
│       ├── shop.html
│       ├── product.html
│       ├── cart.html
│       ├── sign-in.html
│       └── [other pages]
│
├── server/                     # Backend application
│   ├── server.js             # Main Express app
│   ├── db.js                 # Database connection
│   ├── seed.js               # Database seeding script
│   ├── schema.sqlite.sql     # Database schema
│   ├── middleware/           # Custom middleware
│   │   └── authMiddleware.js
│   └── routes/               # API endpoints
│       ├── auth.js          # Authentication endpoints
│       ├── products.js      # Product endpoints
│       ├── cart.js          # Cart endpoints
│       ├── orders.js        # Order endpoints
│       ├── contact.js       # Contact form endpoints
│       └── newsletter.js    # Newsletter endpoints
│
├── .env                       # Environment variables (local)
├── .env.example              # Environment variables example
├── .gitignore                # Git ignore rules
├── package.json              # Project dependencies
├── README.md                 # This file
└── database.sqlite           # SQLite database (generated)
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation Steps

1. **Clone/Download the project**
   ```bash
   cd ITCS223_WebDev
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Initialize database** (if needed)
   ```bash
   npm run seed
   ```

## Running the Application

### Starting the Server

The server runs on **`http://localhost:3000`** by default.

#### Option 1: Using npm start (Recommended)
```bash
npm start
```
- Starts the server in production mode
- Server will be available at http://localhost:3000

#### Option 2: Using npm run dev (Development)
```bash
npm run dev
```
- Uses nodemon for automatic restart on file changes
- Great for development and debugging

#### Option 3: Direct Node Command
```bash
node server/server.js
```

### Server Startup Verification

Once started, verify the server is running:
- Open browser and visit: **`http://localhost:3000`**
- You should see the BoonSonClon home page
- Check console for confirmation message: `Server running on port 3000`

### If Port 3000 is Already in Use

If you get an error that port 3000 is already in use:

**On Windows (PowerShell):**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with the actual process ID)
taskkill /PID <PID> /F

# Then start the server
npm start
```

**On Mac/Linux:**
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Then start the server
npm start
```

### Database Verification

To verify the database is properly configured:
```bash
npm run verify-db
# or
node server/db-verify.js
```

This will check:
- ✅ Admin and Member tables exist
- ✅ Database schema is correct
- ✅ Admin account is seeded
- ✅ Products and categories are loaded
- ✅ Environment variables are configured

### Troubleshooting Server Startup

| Issue | Solution |
|-------|----------|
| Port 3000 in use | Kill existing process (see above) |
| Cannot find module | Run `npm install` |
| Database errors | Run `npm run seed` to reinitialize |
| Dependencies missing | Run `npm install --save` |

The application will be available at `http://localhost:3000`

## Technologies Used

- **Frontend:**
  - HTML5
  - CSS3
  - Vanilla JavaScript
  - Lucide Icons

- **Backend:**
  - Node.js
  - Express.js
  - SQLite3
  - bcrypt (password hashing)
  - express-session (sessions)

- **Database:**
  - SQLite

## Key Features

- User authentication (Sign up/Sign in)
- Product browsing with color selection
- Shopping cart functionality
- Order management
- Admin panel
- Contact form
- Newsletter subscription
- Responsive design

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/meta/categories` - Get categories

### Cart
- `POST /api/cart` - Add to cart
- `GET /api/cart` - Get cart items
- `DELETE /api/cart/:id` - Remove from cart

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders

## File Organization Hierarchy

This project follows a clear hierarchical structure:

1. **Public Directory** - All client-facing assets
   - Separation of concerns
   - Easy to deploy (can be served by CDN)
   
2. **Server Directory** - All backend logic
   - Models/DB operations
   - API routes
   - Middleware

3. **Clean Root** - Only essential config files
   - package.json
   - .env
   - .gitignore
   - README.md

## Removed Files

The following unnecessary files have been removed:
- `check_mysql.bat` - Not needed for SQLite
- `DataBase.sql` - Old MySQL schema
- `nul` - Empty system file
- `.DS_Store` files - macOS system files

## Environment Variables

Create a `.env` file based on `.env.example`:

```
PORT=3000
DATABASE_PATH=./database.sqlite
SESSION_SECRET=boonsonclon_session
NODE_ENV=development
```

## Development Tips

- **Static files** are served from `/public` directory
- **Pages** should be placed in `/public/pages`
- **CSS** files go in `/public/assets/css`
- **JavaScript** files go in `/public/assets/js`
- **Images** are stored in `/public/assets/images`

## Deployment

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
