const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['risk_alert', 'delay_warning', 'milestone', 'system', 'prediction'],
      default: 'system',
    },
    title:   { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 1000 },
    severity: {
      type: String,
      enum: ['info', 'warning', 'danger', 'success'],
      default: 'info',
    },
    read:      { type: Boolean, default: false, index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    link:      { type: String, default: null },   // optional deep-link path
  },
  { timestamps: true }
);

// Auto-generate AI notifications after a prediction is saved
NotificationSchema.statics.createFromPrediction = async function (prediction, projectName) {
  const notes = [];
  const uid   = prediction.userId;

  if (prediction.riskLevel === 'Critical') {
    notes.push({
      userId:    uid,
      type:      'risk_alert',
      title:     '🚨 Critical Risk Detected',
      message:   `Project "${projectName}" has reached CRITICAL risk level (score: ${prediction.predictedRiskScore}/100). Immediate intervention required.`,
      severity:  'danger',
      projectId: prediction.projectId,
      link:      `/predictions/${prediction._id}`,
    });
  } else if (prediction.riskLevel === 'High') {
    notes.push({
      userId:    uid,
      type:      'risk_alert',
      title:     '⚠ High Risk Warning',
      message:   `Project "${projectName}" is at HIGH risk (score: ${prediction.predictedRiskScore}/100). Review recommended actions.`,
      severity:  'warning',
      projectId: prediction.projectId,
      link:      `/predictions/${prediction._id}`,
    });
  }

  if (prediction.delayProbability >= 70) {
    notes.push({
      userId:    uid,
      type:      'delay_warning',
      title:     '📅 High Delay Probability',
      message:   `"${projectName}" has a ${prediction.delayProbability}% probability of delay. Top factor: ${prediction.majorRiskFactors?.[0]?.displayName || 'risk score'}.`,
      severity:  prediction.delayProbability >= 90 ? 'danger' : 'warning',
      projectId: prediction.projectId,
      link:      `/predictions/${prediction._id}`,
    });
  }

  if (notes.length) {
    await this.insertMany(notes);
  }
  return notes.length;
};

module.exports = mongoose.model('Notification', NotificationSchema);
