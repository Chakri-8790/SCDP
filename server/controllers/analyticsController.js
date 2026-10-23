const mongoose = require('mongoose');
const Prediction = require('../models/Prediction');
const Project = require('../models/Project');

// @desc  Get dashboard analytics
// @route GET /api/analytics/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const [
      totalProjects,
      activeProjects,
      delayedProjects,
      highRiskProjects,
      avgRiskData,
      avgProgressData,
      riskDistribution,
      recentPredictions,
    ] = await Promise.all([
      Project.countDocuments({ userId }),
      Project.countDocuments({ userId, status: { $in: ['In Progress', 'At Risk'] } }),
      Project.countDocuments({ userId, status: 'Delayed' }),
      Prediction.countDocuments({ userId, riskLevel: { $in: ['High', 'Critical'] } }),
      Prediction.aggregate([
        { $match: { userId } },
        { $group: { _id: null, avgRisk: { $avg: '$predictedRiskScore' } } },
      ]),
      Project.aggregate([
        { $match: { userId } },
        { $group: { _id: null, avgProgress: { $avg: '$progress' } } },
      ]),
      Prediction.aggregate([
        { $match: { userId } },
        { $group: { _id: '$riskLevel', count: { $sum: 1 } } },
      ]),
      Prediction.find({ userId })
        .sort('-createdAt')
        .limit(10)
        .populate('projectId', 'projectName')
        .select('delayPrediction delayProbability predictedRiskScore riskLevel createdAt'),
    ]);

    res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalProjects,
          activeProjects,
          delayedProjects,
          highRiskProjects,
          averageRiskScore: avgRiskData[0]?.avgRisk?.toFixed(1) || 0,
          averageProgress: avgProgressData[0]?.avgProgress?.toFixed(1) || 0,
        },
        riskDistribution,
        recentPredictions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Get trend analytics
// @route GET /api/analytics/trends
const getTrends = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const { projectId, days = 30 } = req.query;

    const dateFrom = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);
    const matchQuery = { userId, createdAt: { $gte: dateFrom } };
    if (projectId) matchQuery.projectId = new mongoose.Types.ObjectId(projectId);

    const [riskTrend, delayTrend, featureImportance, safetyTrend, costTrend] = await Promise.all([
      Prediction.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            avgRisk: { $avg: '$predictedRiskScore' },
            avgProbability: { $avg: '$delayProbability' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Prediction.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$delayPrediction', count: { $sum: 1 } } },
      ]),
      Prediction.aggregate([
        { $match: matchQuery },
        { $unwind: '$majorRiskFactors' },
        {
          $group: {
            _id: '$majorRiskFactors.feature',
            avgImportance: { $avg: '$majorRiskFactors.importance' },
          },
        },
        { $sort: { avgImportance: -1 } },
        { $limit: 10 },
      ]),
      Prediction.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            avgSafety: { $avg: '$safety_incidents' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Prediction.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            avgCostDev: { $avg: '$cost_deviation' },
            avgTimeDev: { $avg: '$time_deviation' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: { riskTrend, delayTrend, featureImportance, safetyTrend, costTrend },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard, getTrends };
