const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * Call the Python ML service with the 19 raw features.
 * Returns the prediction result object.
 * Falls back to mock prediction if ML service is unavailable.
 */
const getPrediction = async (featureData) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict`, featureData, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.data && response.data.success) {
      return { ...response.data.data, isMock: false };
    }
    throw new Error(response.data?.message || 'ML service returned an error');
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      console.warn('ML service unavailable — using mock prediction fallback');
      return getMockPrediction(featureData);
    }
    throw error;
  }
};

/**
 * Mock prediction for development when ML service is unavailable.
 * Derives values from input features to keep it meaningful.
 * Clearly marked with isMock: true.
 */
const getMockPrediction = (data) => {
  const timeDeviation = parseFloat(data.time_deviation) || 0;
  const costDeviation = parseFloat(data.cost_deviation) || 0;
  const riskScore = parseFloat(data.risk_score) || 0;
  const performance = parseFloat(data.performance_score) || 50;
  const safetyIncidents = parseFloat(data.safety_incidents) || 0;
  const materialShortage = data.material_shortage_alert || 'none';

  const shortageScore = { none: 0, low: 15, medium: 30, high: 50, critical: 70 }[materialShortage] || 0;
  const rawScore =
    0.25 * Math.min(timeDeviation, 90) / 90 * 100 +
    0.20 * Math.min(costDeviation, 80) / 80 * 100 +
    0.20 * riskScore +
    0.15 * (100 - Math.min(performance, 100)) +
    0.10 * shortageScore +
    0.10 * Math.min(safetyIncidents * 5, 50);

  const predictedRiskScore = Math.round(Math.min(100, Math.max(0, rawScore)));
  const delayProbability = Math.round(Math.min(99, Math.max(1, rawScore * 0.95)));

  let delayPrediction, riskLevel;
  if (predictedRiskScore <= 25) { delayPrediction = 'On Schedule'; riskLevel = 'Low'; }
  else if (predictedRiskScore <= 50) { delayPrediction = 'Potential Delay'; riskLevel = 'Medium'; }
  else if (predictedRiskScore <= 75) { delayPrediction = 'Likely Delayed'; riskLevel = 'High'; }
  else { delayPrediction = 'Severe Delay Risk'; riskLevel = 'Critical'; }

  return {
    delayPrediction,
    delayProbability,
    predictedRiskScore,
    riskLevel,
    confidence: 72.5,
    majorRiskFactors: [
      { feature: 'time_deviation', importance: 24.5, displayName: 'Time Deviation' },
      { feature: 'cost_deviation', importance: 19.2, displayName: 'Cost Deviation' },
      { feature: 'risk_score', importance: 17.8, displayName: 'Current Risk Score' },
      { feature: 'performance_score', importance: 14.1, displayName: 'Performance Score' },
      { feature: 'material_shortage_alert', importance: 9.8, displayName: 'Material Shortage' },
      { feature: 'safety_incidents', importance: 7.3, displayName: 'Safety Incidents' },
      { feature: 'equipment_utilization_rate', importance: 4.8, displayName: 'Equipment Utilization' },
      { feature: 'task_progress', importance: 2.5, displayName: 'Task Progress' },
    ],
    isMock: true,
  };
};

const getModelInfo = async () => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/model/info`, { timeout: 5000 });
    return response.data;
  } catch {
    return { success: false, message: 'ML service unavailable' };
  }
};

module.exports = { getPrediction, getMockPrediction, getModelInfo };
