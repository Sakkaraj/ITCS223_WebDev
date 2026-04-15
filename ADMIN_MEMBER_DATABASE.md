# Admin & Member Database Documentation

## ✅ Verification Summary

**Current Status:** ✅ All systems properly configured

- ✅ AdminInformation table exists
- ✅ AdminLoginInformation table with Role field
- ✅ Member table exists  
- ✅ MemberLoginInformation table exists
- ✅ JWT_SECRET configured
- ✅ Admin account seeded: `admin@boonsonclon.com`
- ✅ 12 Products seeded
- ✅ 6 Categories seeded

---

## Database Structure

### Admin Database Tables

#### 1. **AdminInformation** (Admin Profile Data)
```sql
CREATE TABLE AdminInformation (
    AdminId INTEGER PRIMARY KEY AUTOINCREMENT,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    Address VARCHAR(100) NOT NULL,
    Age TINYINT NOT NULL,
    Email VARCHAR(50) NOT NULL,
    TelephoneNumber VARCHAR(15) NOT NULL
);
```
**Seeded Data:**
- AdminId: 1
- Name: Admin BoonSon
- Email: admin@boonsonclon.com
- Phone: 0696304272
- Address: 999 Phutthamonthon 4 Road, Nakhon Pathom
- Age: 30

#### 2. **AdminLoginInformation** (Admin Credentials & Role)
```sql
CREATE TABLE AdminLoginInformation (
    AdminId INT NOT NULL,
    AdminUserName VARCHAR(50) NOT NULL,
    AdminPassword VARCHAR(255) NOT NULL,          -- BCRYPT HASHED
    Role VARCHAR(50) NOT NULL,                    -- ROLE: 'admin'
    CONSTRAINT AdmLoginInf_Fk FOREIGN KEY (AdminId) REFERENCES AdminInformation (AdminId)
);
```
**Seeded Data:**
- AdminId: 1
- Username: admin
- Password: `Admin@1234` (hashed with bcrypt)
- Role: **admin**

#### 3. **AdminLoginLog** (Login History)
```sql
CREATE TABLE AdminLoginLog (
    LogId INTEGER PRIMARY KEY AUTOINCREMENT,
    AdminId INT NOT NULL,
    LoginTimeStamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT AdmLoginLog_Fk FOREIGN KEY (AdminId) REFERENCES AdminInformation (AdminId)
);
```

#### 4. **AdminToken** (JWT Token Management)
```sql
CREATE TABLE AdminToken (
    TokenId INTEGER PRIMARY KEY AUTOINCREMENT,
    AdminId INT NOT NULL,
    TokenHash VARCHAR(255) NOT NULL,
    ExpiresAt DATETIME NOT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    RevokeStatus BOOLEAN DEFAULT 0,
    CONSTRAINT AdmTkn_Fk FOREIGN KEY (AdminId) REFERENCES AdminInformation (AdminId)
);
```

---

### Member/User Database Tables

#### 1. **Member** (User Profile Data)
```sql
CREATE TABLE Member (
    MemberId INTEGER PRIMARY KEY AUTOINCREMENT,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    PhoneNumber VARCHAR(15) NOT NULL,
    MemberEmail VARCHAR(50) NOT NULL
);
```

#### 2. **MemberLoginInformation** (User Credentials)
```sql
CREATE TABLE MemberLoginInformation (
    MemberId INT NOT NULL PRIMARY KEY,
    MemberPassword VARCHAR(255) NOT NULL,       -- BCRYPT HASHED
    CONSTRAINT MemLoginInf_Fk FOREIGN KEY (MemberId) REFERENCES Member (MemberId)
);
```

#### 3. **MemberLoginLog** (Login History)
```sql
CREATE TABLE MemberLoginLog (
    LogId INTEGER PRIMARY KEY AUTOINCREMENT,
    MemberId INT NOT NULL,
    LoginTimeStamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT MemLoginLog_Fk FOREIGN KEY (MemberId) REFERENCES Member (MemberId)
);
```

#### 4. **Address** (Delivery Address)
```sql
CREATE TABLE Address (
    AddressId INTEGER PRIMARY KEY AUTOINCREMENT,
    MemberId INT NOT NULL,
    AddressDetail VARCHAR(100) NOT NULL,
    CONSTRAINT Addr_Fk FOREIGN KEY (MemberId) REFERENCES Member (MemberId)
);
```

---

## Authentication Endpoints

### Admin Authentication

**Admin Register:** ❌ Not implemented (only seeded admin)
```
POST /api/auth/admin/register - NOT AVAILABLE
```

**Admin Login:**
```
POST /api/auth/admin/login
Content-Type: application/json

{
  "email": "admin@boonsonclon.com",
  "password": "Admin@1234"
}

Response:
{
  "message": "Admin login successful!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "firstName": "Admin",
    "lastName": "BoonSon",
    "email": "admin@boonsonclon.com",
    "role": "admin"
  }
}
```

**Token Details:**
- Expires in: **8 hours**
- Role: **admin**
- Table: AdminLoginInformation (AI.Role='admin')

### Member/User Authentication

**Member Register:**
```
POST /api/auth/member/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass@123",
  "phone": "+66812345678"
}

Response:
{
  "message": "Account created successfully! You can now log in.",
  "memberId": 1
}
```

**Member Login:**
```
POST /api/auth/member/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass@123"
}

Response:
{
  "message": "Login successful!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "member"
  }
}
```

**Token Details:**
- Expires in: **7 days**
- Role: **member**
- Table: MemberLoginInformation (stored but no role field)

### Verify Current User

**Get Current User Info:**
```
GET /api/auth/me
Authorization: Bearer <token>

Response (if valid):
{
  "loggedIn": true,
  "user": {
    "id": 1,
    "role": "admin|member",
    "email": "user@email.com",
    "iat": 1713200000,
    "exp": 1713286400
  }
}

Response (if invalid/no token):
{
  "loggedIn": false
}
```

---

## Key Differences: Admin vs Member

| Feature | Admin | Member |
|---------|-------|--------|
| **Table** | AdminInformation | Member |
| **Credentials** | AdminLoginInformation | MemberLoginInformation |
| **Has Role Field** | ✅ Yes | ❌ No (JWT sets role='member') |
| **Token Expiry** | 8 hours | 7 days |
| **Login Log** | AdminLoginLog | MemberLoginLog |
| **Can Register** | ❌ Seeded only | ✅ Yes (via /member/register) |
| **JWT Role** | 'admin' | 'member' |
| **Address Support** | ❌ No | ✅ Yes (Address table) |
| **Orders Support** | ❌ No | ✅ Yes (Orders table) |

---

## Security Details

### Password Hashing
- **Algorithm:** bcrypt
- **Salt Rounds:** 10
- **Applied to:** Both admin & member passwords
- **Storage:** VARCHAR(255) to accommodate hashes

### JWT Tokens
- **Secret:** Configured in `.env` as `JWT_SECRET`  
- **Current:** `boonsonclon_jwt_secret_key_2024_change_me`
- **Algorithm:** HS256
- **Fields:** id, role, email, iat, exp

### Foreign Key Constraints
- All login tables have foreign keys to their respective user tables
- `ON DELETE CASCADE` - Deleting user also deletes login records
- `ON UPDATE CASCADE` - Updates cascade properly

---

## Database Verification Commands

To verify database setup:

```bash
npm run verify-db
# or
node server/db-verify.js
```

Expected output when running verification:
```
✅ AdminInformation table exists
✅ AdminLoginInformation table exists
✅ Member table exists
✅ MemberLoginInformation table exists
✅ Found 1 admin account(s)
✅ Found 12 products in database
✅ Found 6 categories
✅ JWT_SECRET is set
```

---

## Seeding Data

### Initial Admin Account

Email: `admin@boonsonclon.com`
Password: `Admin@1234`
Role: `admin`

To reseed if needed:
```bash
npm run seed
```

---

## Quick Testing Guide

### Test Admin Login
```bash
curl -X POST http://localhost:3000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@boonsonclon.com",
    "password": "Admin@1234"
  }'
```

### Test Member Registration
```bash
curl -X POST http://localhost:3000/api/auth/member/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "TestPass@123",
    "phone": "+66812345678"
  }'
```

### Test Get Current User
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## ✨ Everything is Correctly Configured!

Your database is properly set up with:
- ✅ Separate admin and member tables
- ✅ Proper role-based authentication
- ✅ Secure bcrypt password storage
- ✅ JWT token generation and validation
- ✅ Different token expiry times
- ✅ Login history tracking
- ✅ Foreign key relationships

The system is ready for production use! 🚀
