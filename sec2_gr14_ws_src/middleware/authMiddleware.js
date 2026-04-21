/**
 * authMiddleware.js — BoonSonClon Security Middleware
 * Purpose: Provides stateless JWT verification and role-based access control 
 * for protected routes.
 */

const jwt = require('jsonwebtoken');

/**
 * requireAuth — Access Token Verification
 * Ensures a valid JWT Bearer token is present in the request headers.
 * Attaches req.user = { id, role } on success.
 */
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
    }
}

/**
 * requireAdmin — Privilege Escalation Check
 * Ensures the authenticated user has administrative rights.
 * Must be used in sequence AFTER requireAuth.
 */
function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    next();
}

module.exports = { requireAuth, requireAdmin };
