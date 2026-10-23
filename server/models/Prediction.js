const mongoose = require('mongoose');

const RecommendationSchema = new mongoose.Schema({
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  issue: String,
  action: String,
  reason: String,
  expectedBenefit: String,
}, { _id: false });

const RiskFactorSchema = new mongoose.Schema({
  feature: String,
  importance: Number,
  displayName: String,
}, { _id: false });

const PredictionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },

    // ─── 19 Input Features ───────────────────────────────────────────
    timestamp: { type: Date, default: Date.now },
    temperature: { type: Number },
    humidity: { type: Number },
    vibration_level: { type: Number },
    material_usage: { type: Number },
    machinery_status: { type: String },
    worker_count: { type: Number },
    energy_consumption: { type: Number },
    task_progress: { type: Number },
    cost_deviation: { type: Number },
    time_deviation: { type: Number },
    safety_incidents: { type: Number },
    equipment_utilization_rate: { type: Number },
    material_shortage_alert: { type: String },
    risk_score: { type: Number },           // Input: current/historical risk score
    simulation_deviation: { type: Number },
    update_frequency: { type: Number },
    optimization_suggestion: { type: String },
    performance_score: { type: Number },

    // ─── Prediction Outputs ──────────────────────────────────────────
    delayPrediction: {
      type: String,
      enum: [
        // binary model labels (current)
        'No Delay', 'Delay',
        // legacy 4-class labels (kept for backwards compat)
        'On Schedule', 'Potential Delay', 'Likely Delayed', 'Severe Delay Risk',
      ],
      required: true,
    },
    delayProbability: { type: Number, min: 0, max: 100 },
    predictedRiskScore: { type: Number, min: 0, max: 100 }, // Predicted (not input)
    riskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
    },
    confidence: { type: Number, min: 0, max: 100 },
    majorRiskFactors: [RiskFactorSchema],
    recommendations: [RecommendationSchema],
    classProbabilities: { type: mongoose.Schema.Types.Mixed },
    modelInfo: { type: mongoose.Schema.Types.Mixed },

    // ─── Mock flag ───────────────────────────────────────────────────
    isMock: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Prediction', PredictionSchema);
