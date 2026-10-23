const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getStats, getUsers, updateUser, deleteUser, getPerformanceMetrics } = require('../controllers/adminController');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/stats',        getStats);
router.get('/users',        getUsers);
router.get('/performance',  getPerformanceMetrics);
router.put('/users/:id',    updateUser);
router.delete('/users/:id', deleteUser);

module.exports = router;
