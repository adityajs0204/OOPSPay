const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// GET /api/notifications/:uid - Get all notifications for a user
router.get('/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    const snapshot = await db.collection('notifications')
      .where('userId', '==', uid)
      .get();

    const notifications = [];
    snapshot.docs.forEach((doc) => {
      notifications.push({ id: doc.id, ...doc.data() });
    });

    // Sort by createdAt descending, limit 50
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const limited = notifications.slice(0, 50);

    res.json({ notifications: limited });
  } catch (err) {
    console.error('[Notifications] Fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch notifications', details: err.message });
  }
});

// GET /api/notifications/unread-count/:uid - Get count of unread notifications
router.get('/unread-count/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    const snapshot = await db.collection('notifications')
      .where('userId', '==', uid)
      .where('read', '==', false)
      .get();

    res.json({ unreadCount: snapshot.docs.length });
  } catch (err) {
    console.error('[Notifications] Unread count error:', err.message);
    res.status(500).json({ error: 'Failed to get unread count', details: err.message });
  }
});

// PATCH /api/notifications/:notificationId/read - Mark a notification as read
router.patch('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;

    const docRef = db.collection('notifications').doc(notificationId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await docRef.update({
      read: true,
      readAt: new Date().toISOString(),
    });

    res.json({ message: 'Notification marked as read', notificationId });
  } catch (err) {
    console.error('[Notifications] Mark read error:', err.message);
    res.status(500).json({ error: 'Failed to mark notification as read', details: err.message });
  }
});

// PATCH /api/notifications/read-all/:uid - Mark all notifications as read for a user
router.patch('/read-all/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    const snapshot = await db.collection('notifications')
      .where('userId', '==', uid)
      .where('read', '==', false)
      .get();

    let updatedCount = 0;
    for (const doc of snapshot.docs) {
      await db.collection('notifications').doc(doc.id).update({
        read: true,
        readAt: new Date().toISOString(),
      });
      updatedCount++;
    }

    res.json({ message: `Marked ${updatedCount} notifications as read`, updatedCount });
  } catch (err) {
    console.error('[Notifications] Mark all read error:', err.message);
    res.status(500).json({ error: 'Failed to mark all as read', details: err.message });
  }
});

module.exports = router;
