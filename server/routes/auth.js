const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const SALT_ROUNDS = 10;

// ─────────────────────────────────────────────
//  MEMBER REGISTER
// ─────────────────────────────────────────────
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

    return res.status(201).json({
      message: 'Account created successfully! You can now log in.',
      memberId,
    });
  } catch (err) {
    console.error('[member/register]', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ─────────────────────────────────────────────
//  MEMBER LOGIN
// ─────────────────────────────────────────────
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
// POST /api/auth/admin/login
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const [rows] = await db.execute(
      `SELECT ai.AdminId, ai.FirstName, ai.LastName, ai.Email,
              ali.AdminPassword, ali.Role
       FROM AdminInformation ai
       JOIN AdminLoginInformation ali ON ai.AdminId = ali.AdminId
       WHERE ai.Email = ?`,
      [email]
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
        role: admin.Role,
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
