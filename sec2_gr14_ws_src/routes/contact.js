/**
 * contact.js — BoonSonClon Contact Inquiries
 * Purpose: Route handler for processing public inquiries through the contact form.
 */

const express = require('express');
const db = require('../db');

const router = express.Router();

/**
 * POST /api/contact
 * Persists a new user inquiry message to the database.
 */
router.post('/', async (req, res) => {
    const { firstName, lastName, email, message } = req.body;

    if (!firstName || !email || !message) {
        return res.status(400).json({ error: 'First name, email, and message are required.' });
    }

    try {
        await db.execute(
            'INSERT INTO Contactors (FirstName, LastName, Email, Message) VALUES (?, ?, ?, ?)',
            [firstName, lastName || null, email, message]
        );
        return res.status(201).json({ message: 'Your message has been sent! We will get back to you soon.' });
    } catch (err) {
        console.error('[POST /contact]', err);
        return res.status(500).json({ error: 'Failed to send message. Please try again.' });
    }
});

module.exports = router;
