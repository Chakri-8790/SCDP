const express = require('express');
const router = express.Router();
const { getDashboard, getTrends } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/dashboard', getDashboard);
router.get('/trends', getTrends);

module.exports = router;
