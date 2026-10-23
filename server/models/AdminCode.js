const mongoose = require('mongoose');

/**
 * AdminCode — stores valid SCDP-XXXX invite codes.
 * Each code can be used exactly once to create an admin account.
 */
const AdminCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^SCDP-\d{4}$/, 'Code must match pattern SCDP-XXXX'],
    },
    used: {
      type: Boolean,
      default: false,
    },
    usedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: String,
      default: 'system',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminCode', AdminCodeSchema);
