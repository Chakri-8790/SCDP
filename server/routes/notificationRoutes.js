const express = require('express');
const router  = express.Router();
const {
  getNotifications, markRead, deleteNotification, getUnreadCount,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/',        getNotifications);
router.get('/count',   getUnreadCount);
router.put('/read',    markRead);
router.delete('/:id',  deleteNotification);

module.exports = router;
