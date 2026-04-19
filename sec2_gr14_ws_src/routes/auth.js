const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const SALT_ROUNDS = 10;

// ─────────────────────────────────────────────
//  MEMBER REGISTER
// ─────────────────────────────────────────────
// Testing Member Registration
// method: POST
// URL: http://localhost:3000/api/auth/member/register
// body: raw JSON
// {
//   "firstName": "John",
//   "lastName": "Doe",
//   "email": "john.doe@email.com",
//   "password": "SecurePass123",
//   "phone": "0896604300"
// }
// Expected: 201 Created with token and user info

// Testing Member Registration - Duplicate Email
// method: POST
// URL: http://localhost:3000/api/auth/member/register
// body: raw JSON
// {
//   "firstName": "Jane",
//   "lastName": "Smith",
//   "email": "john.doe@email.com",
//   "password": "AnotherPass123",
//   "phone": "0896604301"
// }
// Expected: 409 Conflict - Email already exists

// POST /api/auth/member/register
router.post('/member/register', async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;

  if (!firstName || !lastName || !email || !password || !phone) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    // Check if email already exists
    const [existing] = await db.execute(
      'SELECT MemberId FROM Member WHERE MemberEmail = ?',
      [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert into Member
    const [memberResult] = await db.execute(
      'INSERT INTO Member (FirstName, LastName, PhoneNumber, MemberEmail) VALUES (?, ?, ?, ?)',
      [firstName, lastName, phone, email]
    );
    const memberId = memberResult.insertId;

    // Insert into MemberLoginInformation
    await db.execute(
      'INSERT INTO MemberLoginInformation (MemberId, MemberPassword) VALUES (?, ?)',
      [memberId, hashedPassword]
    );

    // Log the login
    await db.execute(
      'INSERT INTO MemberLoginLog (MemberId) VALUES (?)',
      [memberId]
    );

    const token = jwt.sign(
      { id: memberId, role: 'member', email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: {
        id: memberId,
        firstName,
        lastName,
        email,
        role: 'member',
      },
    });
  } catch (err) {
    console.error('[member/register]', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ─────────────────────────────────────────────
//  ADMIN REGISTER
// ─────────────────────────────────────────────
// Testing Admin Registration
// method: POST
// URL: http://localhost:3000/api/auth/admin/register
// body: raw JSON
// {
//   "firstName": "Admin",
//   "lastName": "User",
//   "email": "admin.user@email.com",
//   "password": "SecurePass123",
//   "address": "123 Main Street, City",
//   "age": "35",
//   "phone": "0896604302"
// }
// Expected: 201 Created with token and admin info

// Testing Admin Registration - Duplicate Email
// method: POST
// URL: http://localhost:3000/api/auth/admin/register
// body: raw JSON
// {
//   "firstName": "Another",
//   "lastName": "Admin",
//   "email": "admin.user@email.com",
//   "password": "AnotherPass123",
//   "address": "456 Second Avenue",
//   "age": "40",
//   "phone": "0896604303"
// }
// Expected: 409 Conflict - Admin account with this email already exists

// POST /api/auth/admin/register
router.post('/admin/register', async (req, res) => {
  const { firstName, lastName, email, password, address, age, phone } = req.body;

  if (!firstName || !lastName || !email || !password || !address || !age || !phone) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    // Check if email already exists in AdminInformation
    const [existing] = await db.execute(
      'SELECT AdminId FROM AdminInformation WHERE Email = ?',
      [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An admin account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert into AdminInformation
    const [adminResult] = await db.execute(
      'INSERT INTO AdminInformation (FirstName, LastName, Email, TelephoneNumber, Address, Age) VALUES (?, ?, ?, ?, ?, ?)',
      [firstName, lastName, email, phone, address, parseInt(age)]
    );
    const adminId = adminResult.insertId;

    // Insert into AdminLoginInformation
    await db.execute(
      'INSERT INTO AdminLoginInformation (AdminId, AdminUserName, AdminPassword, Role) VALUES (?, ?, ?, ?)',
      [adminId, email, hashedPassword, 'admin']
    );

    // Log the login
    await db.execute(
      'INSERT INTO AdminLoginLog (AdminId) VALUES (?)',
      [adminId]
    );

    const token = jwt.sign(
      { id: adminId, role: 'admin', email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(201).json({
      message: 'Admin account created successfully!',
      token,
      user: {
        id: adminId,
        firstName,
        lastName,
        email,
        role: 'admin',
      },
    });
  } catch (err) {
    console.error('[admin/register]', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ─────────────────────────────────────────────
//  MEMBER LOGIN
// ─────────────────────────────────────────────
// Testing Member Login - Success
// method: POST
// URL: http://localhost:3000/api/auth/member/login
// body: raw JSON
// {
//   "email": "john.doe@email.com",
//   "password": "SecurePass123"
// }
// Expected: 200 OK with token and user info

// Testing Member Login - Invalid Credentials
// method: POST
// URL: http://localhost:3000/api/auth/member/login
// body: raw JSON
// {
//   "email": "john.doe@email.com",
//   "password": "WrongPassword123"
// }
// Expected: 401 Unauthorized - Invalid credentials

// POST /api/auth/member/login
router.post('/member/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const [rows] = await db.execute(
      `SELECT m.MemberId, m.FirstName, m.LastName, m.MemberEmail,
              mli.MemberPassword
       FROM Member m
       JOIN MemberLoginInformation mli ON m.MemberId = mli.MemberId
       WHERE m.MemberEmail = ?`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const member = rows[0];
    const passwordMatch = await bcrypt.compare(password, member.MemberPassword);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Log the login
    await db.execute(
      'INSERT INTO MemberLoginLog (MemberId) VALUES (?)',
      [member.MemberId]
    );

    const token = jwt.sign(
      { id: member.MemberId, role: 'member', email: member.MemberEmail },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful!',
      token,
      user: {
        id: member.MemberId,
        firstName: member.FirstName,
        lastName: member.LastName,
        email: member.MemberEmail,
        role: 'member',
      },
    });
  } catch (err) {
    console.error('[member/login]', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ─────────────────────────────────────────────
//  ADMIN LOGIN
// ─────────────────────────────────────────────
// Testing Admin Login - Valid Credentials
// method: POST
// URL: http://localhost:3000/api/auth/admin/login
// body: raw JSON
// {
//   "email": "admin@boonsonclon.com",
//   "password": "Admin@1234"
// }
// Expected: 200 OK with token and admin user info

// Testing Admin Login - Invalid Email
// method: POST
// URL: http://localhost:3000/api/auth/admin/login
// body: raw JSON
// {
//   "email": "nonexistent@email.com",
//   "password": "SomePassword123"
// }
// Expected: 401 Unauthorized - Invalid email or password

// POST /api/auth/admin/login
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // We allow login via either Email (AdminInformation) or AdminUserName (AdminLoginInformation)
    const [rows] = await db.execute(
      `SELECT ai.AdminId, ai.FirstName, ai.LastName, ai.Email,
              ali.AdminPassword, ali.Role
       FROM AdminInformation ai
       JOIN AdminLoginInformation ali ON ai.AdminId = ali.AdminId
       WHERE ai.Email = ? OR ali.AdminUserName = ?`,
      [email, email] // Using 'email' variable for both placeholders as it holds the identifier
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const admin = rows[0];
    const passwordMatch = await bcrypt.compare(password, admin.AdminPassword);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Log the login
    await db.execute(
      'INSERT INTO AdminLoginLog (AdminId) VALUES (?)',
      [admin.AdminId]
    );

    const token = jwt.sign(
      { id: admin.AdminId, role: 'admin', email: admin.Email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      message: 'Admin login successful!',
      token,
      user: {
        id: admin.AdminId,
        firstName: admin.FirstName,
        lastName: admin.LastName,
        email: admin.Email,
        role: 'admin',
      },
    });
  } catch (err) {
    console.error('[admin/login]', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ─────────────────────────────────────────────
//  GET CURRENT USER INFO (verify token)
// ─────────────────────────────────────────────
// GET /api/auth/me
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({ loggedIn: false });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return res.json({ loggedIn: true, user: decoded });
  } catch {
    return res.json({ loggedIn: false });
  }
});

module.exports = router;
