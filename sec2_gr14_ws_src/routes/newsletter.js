/**
 * newsletter.js — BoonSonClon Newsletter Subscription
 * Purpose: Route handler for managing email subscriptions to the mailing list.
 */

const express = require('express');
const db = require('../db');

const router = express.Router();

/**
 * POST /api/newsletter
 * Registers a new email for the newsletter if it doesn't already exist.
 */
router.post('/', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
    }

    try {
        // Check if already subscribed
        const [existing] = await db.execute(
            'SELECT SubscriberId FROM NewsLetterSubscriber WHERE Email = ?',
            [email]
        );
        if (existing.length > 0) {
            return res.status(409).json({ message: 'You are already subscribed!' });
        }

        await db.execute('INSERT INTO NewsLetterSubscriber (Email) VALUES (?)', [email]);
        return res.status(201).json({ message: 'Subscribed successfully! Thank you.' });
    } catch (err) {
        console.error('[POST /newsletter]', err);
        return res.status(500).json({ error: 'Failed to subscribe. Please try again.' });
    }
});

module.exports = router;
