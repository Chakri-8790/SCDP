const Prediction = require('../models/Prediction');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const { getPrediction: getMLPrediction } = require('../services/mlService');
const { generateRecommendations } = require('../services/recommendationService');

// @desc  Create a new prediction
// @route POST /api/predictions
const createPrediction = async (req, res, next) => {
  try {
    const { projectId, ...featureData } = req.body;

    // Verify project belongs to user
    const project = await Project.findOne({ _id: projectId, userId: req.user._id });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Call ML service
    const mlResult = await getMLPrediction(featureData);

    // Generate recommendations
    const recommendations = generateRecommendations(featureData, mlResult);

    // Merge ML recommendations with generated ones (prefer generated for richness)
    const finalRecommendations = recommendations.length > 0 ? recommendations : (mlResult.recommendations || []);

    // Build prediction document
    const predictionData = {
      userId: req.user._id,
      projectId,
      // 19 input features
      timestamp: featureData.timestamp || new Date(),
      temperature: featureData.temperature,
      humidity: featureData.humidity,
      vibration_level: featureData.vibration_level,
      material_usage: featureData.material_usage,
      machinery_status: featureData.machinery_status,
      worker_count: featureData.worker_count,
      energy_consumption: featureData.energy_consumption,
      task_progress: featureData.task_progress,
      cost_deviation: featureData.cost_deviation,
      time_deviation: featureData.time_deviation,
      safety_incidents: featureData.safety_incidents,
      equipment_utilization_rate: featureData.equipment_utilization_rate,
      material_shortage_alert: featureData.material_shortage_alert,
      risk_score: featureData.risk_score,
      simulation_deviation: featureData.simulation_deviation,
      update_frequency: featureData.update_frequency,
      optimization_suggestion: featureData.optimization_suggestion,
      performance_score: featureData.performance_score,
      // Outputs
      delayPrediction: mlResult.delayPrediction,
      delayProbability: mlResult.delayProbability,
      predictedRiskScore: mlResult.predictedRiskScore,
      riskLevel: mlResult.riskLevel,
      confidence: mlResult.confidence,
      majorRiskFactors: mlResult.majorRiskFactors || [],
      recommendations: finalRecommendations,
      classProbabilities: mlResult.classProbabilities,
      modelInfo: mlResult.modelInfo,
      isMock: mlResult.isMock || false,
    };

    const prediction = await Prediction.create(predictionData);

    // Update project with latest prediction and auto-update status
    const statusMap = {
      // binary model (current)
      'No Delay': 'In Progress',
      'Delay':    'Delayed',
      // legacy 4-class labels (backwards compat)
      'On Schedule':       'In Progress',
      'Potential Delay':   'At Risk',
      'Likely Delayed':    'Delayed',
      'Severe Delay Risk': 'Delayed',
    };

    await Project.findByIdAndUpdate(projectId, {
      latestPrediction: prediction._id,
      status: statusMap[mlResult.delayPrediction] || project.status,
    });

    // Generate AI notifications based on risk/delay level (best-effort)
    try {
      await Notification.createFromPrediction(prediction, project.projectName);
    } catch (notifErr) {
      console.warn('Notification creation failed:', notifErr.message);
    }

    res.status(201).json({ success: true, data: { prediction } });
  } catch (error) {
    next(error);
  }
};

// @desc  Get all predictions for user
// @route GET /api/predictions
const getPredictions = async (req, res, next) => {
  try {
    const { projectId, riskLevel, search, sort = '-createdAt', page = 1, limit = 20 } = req.query;

    const query = { userId: req.user._id };
    if (projectId) query.projectId = projectId;
    if (riskLevel) query.riskLevel = riskLevel;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Prediction.countDocuments(query);
    const predictions = await Prediction.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('projectId', 'projectName projectId location')
      .select('-majorRiskFactors -recommendations -classProbabilities -modelInfo');

    res.status(200).json({
      success: true,
      data: {
        predictions,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Get single prediction
// @route GET /api/predictions/:id
const getPrediction = async (req, res, next) => {
  try {
    const prediction = await Prediction.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('projectId', 'projectName projectId location manager startDate expectedEndDate');

    if (!prediction) {
      return res.status(404).json({ success: false, message: 'Prediction not found' });
    }

    res.status(200).json({ success: true, data: { prediction } });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete prediction
// @route DELETE /api/predictions/:id
const deletePrediction = async (req, res, next) => {
  try {
    const prediction = await Prediction.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!prediction) {
      return res.status(404).json({ success: false, message: 'Prediction not found' });
    }

    res.status(200).json({ success: true, data: {}, message: 'Prediction deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createPrediction, getPredictions, getPrediction, deletePrediction };
