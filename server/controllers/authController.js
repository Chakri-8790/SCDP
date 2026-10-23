const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AdminCode = require('../models/AdminCode');
const { sendPasswordResetEmail, sendWelcomeEmail, sendOtpEmail } = require('../services/emailService');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @desc  Register user
// @route POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email is already registered' });
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: { _id: user._id, name: user.name, email: user.email, role: user.role },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Login user
// @route POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      data: {
        token,
        user: { _id: user._id, name: user.name, email: user.email, role: user.role },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Get current user
// @route GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      data: { user: { _id: user._id, name: user.name, email: user.email, role: user.role } },
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Forgot password — sends OTP to registered email
// @route POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If that email is registered, an OTP has been sent.',
      });
    }

    const otp = user.getOtp();
    await user.save({ validateBeforeSave: false });

    try {
      await sendOtpEmail({ to: user.email, otp, name: user.name });
    } catch (emailError) {
      // In development: log OTP to console so you can test without Resend configured.
      // In production: clear OTP and return error.
      if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠ Email not configured — OTP for testing:', otp);
        console.warn('  User:', user.email);
        console.warn('  Set RESEND_API_KEY in .env to send real emails.');
        // DO NOT clear OTP — let dev test via console
      } else {
        user.otpCode   = undefined;
        user.otpExpire = undefined;
        await user.save({ validateBeforeSave: false });
        console.error('OTP email send error:', emailError.message);
        return res.status(500).json({ success: false, message: 'Email could not be sent. Please try again.' });
      }
    }

    res.status(200).json({
      success: true,
      message: 'If that email is registered, an OTP has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Verify OTP and return a short-lived reset token
// @route POST /api/auth/verify-otp
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
    }

    const hashedOtp = crypto.createHash('sha256').update(otp.toString().trim()).digest('hex');
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      otpCode:   hashedOtp,
      otpExpire: { $gt: Date.now() },
    }).select('+otpCode +otpExpire');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    // OTP verified — issue a short-lived reset token (10 min) and clear OTP
    const resetToken       = user.getResetPasswordToken();
    user.otpCode           = undefined;
    user.otpExpire         = undefined;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 min
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'OTP verified. Proceed to set a new password.',
      data: { resetToken },
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Reset password
// @route POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const jwtToken = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      data: { token: jwtToken },
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Register admin using SCDP-XXXX invite code
// @route POST /api/auth/register-admin
const registerAdmin = async (req, res, next) => {
  try {
    const { name, email, password, adminCode } = req.body;

    // 1. Validate code format
    const codeUpper = (adminCode || '').toUpperCase().trim();
    if (!/^SCDP-\d{4}$/.test(codeUpper)) {
      return res.status(400).json({ success: false, message: 'Invalid admin code format. Use SCDP-XXXX.' });
    }

    // 2. Look up code in DB
    const codeDoc = await AdminCode.findOne({ code: codeUpper });
    if (!codeDoc) {
      return res.status(400).json({ success: false, message: 'Admin code not recognised.' });
    }
    if (codeDoc.used) {
      return res.status(400).json({ success: false, message: 'This admin code has already been used.' });
    }

    // 3. Check email not already taken
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email is already registered.' });
    }

    // 4. Create admin user
    const user = await User.create({ name, email, password, role: 'admin' });

    // 5. Mark code as used
    codeDoc.used   = true;
    codeDoc.usedBy = user._id;
    codeDoc.usedAt = new Date();
    await codeDoc.save();

    // 6. Send welcome email (best-effort)
    try {
      await sendWelcomeEmail({ to: user.email, name: user.name, role: 'admin', code: codeUpper });
    } catch (emailErr) {
      console.error('Welcome email failed:', emailErr.message);
    }

    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      data: {
        token,
        user: { _id: user._id, name: user.name, email: user.email, role: user.role },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Seed / add admin codes (protected — existing admin only)
// @route POST /api/auth/admin-codes
const addAdminCodes = async (req, res, next) => {
  try {
    const { codes } = req.body; // array of SCDP-XXXX strings
    if (!Array.isArray(codes) || codes.length === 0) {
      return res.status(400).json({ success: false, message: 'Provide an array of codes.' });
    }

    const results = [];
    for (const raw of codes) {
      const code = raw.toUpperCase().trim();
      if (!/^SCDP-\d{4}$/.test(code)) {
        results.push({ code, status: 'invalid format' });
        continue;
      }
      try {
        await AdminCode.create({ code, createdBy: req.user.email });
        results.push({ code, status: 'created' });
      } catch (e) {
        results.push({ code, status: e.code === 11000 ? 'already exists' : 'error' });
      }
    }

    res.status(200).json({ success: true, data: { results } });
  } catch (error) {
    next(error);
  }
};

// @desc  List admin codes (protected — existing admin only)
// @route GET /api/auth/admin-codes
const listAdminCodes = async (req, res, next) => {
  try {
    const codes = await AdminCode.find()
      .sort('-createdAt')
      .populate('usedBy', 'name email');
    res.status(200).json({ success: true, data: { codes } });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, forgotPassword, verifyOtp, resetPassword, registerAdmin, addAdminCodes, listAdminCodes };
