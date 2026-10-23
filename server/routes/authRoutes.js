const express = require('express');
const router = express.Router();
const {
  register, login, getMe, forgotPassword, verifyOtp,
  resetPassword, registerAdmin, addAdminCodes, listAdminCodes,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  registerAdminValidation,
} = require('../middleware/validationMiddleware');

router.post('/register',        registerValidation,       register);
router.post('/register-admin',  registerAdminValidation,  registerAdmin);
router.post('/login',           loginValidation,          login);
router.get('/me',               protect,                  getMe);
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);
router.post('/verify-otp',                                verifyOtp);
router.post('/reset-password',  resetPasswordValidation,  resetPassword);

// Admin code management — existing admins only
router.post('/admin-codes', protect, authorize('admin'), addAdminCodes);
router.get('/admin-codes',  protect, authorize('admin'), listAdminCodes);

module.exports = router;
