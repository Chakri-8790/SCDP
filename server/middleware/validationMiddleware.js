const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) throw new Error('Passwords do not match');
    return true;
  }),
  handleValidationErrors,
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

const forgotPasswordValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  handleValidationErrors,
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) throw new Error('Passwords do not match');
    return true;
  }),
  handleValidationErrors,
];

const projectValidation = [
  body('projectName').trim().notEmpty().withMessage('Project name is required'),
  body('progress').optional().isFloat({ min: 0, max: 100 }).withMessage('Progress must be 0-100'),
  body('status')
    .optional()
    .isIn(['Planning', 'In Progress', 'At Risk', 'Delayed', 'Completed'])
    .withMessage('Invalid status'),
  handleValidationErrors,
];

const predictionValidation = [
  body('projectId').notEmpty().withMessage('Project ID is required'),
  body('humidity').optional().isFloat({ min: 0, max: 100 }).withMessage('Humidity must be 0-100'),
  body('task_progress').optional().isFloat({ min: 0, max: 100 }).withMessage('Task progress must be 0-100'),
  body('equipment_utilization_rate').optional().isFloat({ min: 0, max: 100 }).withMessage('Equipment utilization must be 0-100'),
  body('performance_score').optional().isFloat({ min: 0, max: 100 }).withMessage('Performance score must be 0-100'),
  body('worker_count').optional().isFloat({ min: 0 }).withMessage('Worker count must be >= 0'),
  body('safety_incidents').optional().isFloat({ min: 0 }).withMessage('Safety incidents must be >= 0'),
  handleValidationErrors,
];

const registerAdminValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) throw new Error('Passwords do not match');
    return true;
  }),
  body('adminCode')
    .trim()
    .notEmpty().withMessage('Admin invite code is required')
    .matches(/^SCDP-\d{4}$/i).withMessage('Code must be in format SCDP-XXXX (e.g. SCDP-0042)'),
  handleValidationErrors,
];

module.exports = {
  registerValidation,
  registerAdminValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  projectValidation,
  predictionValidation,
};
