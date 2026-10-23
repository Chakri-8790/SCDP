const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Project = require('../models/Project');
const Prediction = require('../models/Prediction');

// @desc  Get admin stats — user counts by role, total projects/predictions
// @route GET /api/admin/stats
const getStats = async (req, res, next) => {
  try {
    const [
      usersByRole,
      totalUsers,
      totalProjects,
      totalPredictions,
      recentUsers,
    ] = await Promise.all([
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      User.countDocuments(),
      Project.countDocuments(),
      Prediction.countDocuments(),
      User.find()
        .sort('-createdAt')
        .limit(5)
        .select('name email role createdAt'),
    ]);

    // Normalise role counts into a flat map
    const roleCounts = { user: 0, manager: 0, admin: 0 };
    usersByRole.forEach(({ _id, count }) => {
      if (_id in roleCounts) roleCounts[_id] = count;
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalProjects,
          totalPredictions,
          usersByRole: roleCounts,
        },
        recentUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Get all users (paginated, searchable, filterable by role)
// @route GET /api/admin/users
const getUsers = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.role && ['user', 'manager', 'admin'].includes(req.query.role)) {
      filter.role = req.query.role;
    }
    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort(req.query.sort === 'name' ? 'name' : '-createdAt')
        .skip(skip)
        .limit(limit)
        .select('name email role createdAt updatedAt'),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Update a user's role (and optionally name)
// @route PUT /api/admin/users/:id
const updateUser = async (req, res, next) => {
  try {
    const { role, name } = req.body;

    // Prevent admin from demoting themselves
    if (req.params.id === req.user._id.toString() && role && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own admin role.',
      });
    }

    const updates = {};
    if (role && ['user', 'manager', 'admin'].includes(role)) updates.role = role;
    if (name && typeof name === 'string' && name.trim().length > 0) {
      updates.name = name.trim().substring(0, 100);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('name email role createdAt updatedAt');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete a user and cascade-delete their projects + predictions
// @route DELETE /api/admin/users/:id
const deleteUser = async (req, res, next) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account from the admin panel.',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const userId = user._id;
    await Promise.all([
      Prediction.deleteMany({ userId }),
      Project.deleteMany({ userId }),
    ]);
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      data: { message: `User "${user.name}" and all their data have been deleted.` },
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Get ML model + platform performance metrics
// @route GET /api/admin/performance
const getPerformanceMetrics = async (req, res, next) => {
  try {
    // ── ML model metadata from training artifacts ──────────────────
    let modelMeta = null;
    try {
      const metaPath = path.join(__dirname, '../../ml-service/artifacts/model_meta.json');
      const raw = fs.readFileSync(metaPath, 'utf8');
      modelMeta = JSON.parse(raw);
    } catch {
      // ML service artifacts not present — return nulls gracefully
    }

    // ── Platform prediction stats (last 30 days vs prior 30 days) ──
    const now = Date.now();
    const ms30 = 30 * 24 * 60 * 60 * 1000;
    const last30Start  = new Date(now - ms30);
    const prior30Start = new Date(now - ms30 * 2);

    const [
      totalPredictions,
      predictionsLast30,
      predictionsPrior30,
      riskBreakdown,
      delayBreakdown,
      avgRiskLast30,
      topProjects,
      dailyVolume,
    ] = await Promise.all([
      Prediction.countDocuments(),
      Prediction.countDocuments({ createdAt: { $gte: last30Start } }),
      Prediction.countDocuments({ createdAt: { $gte: prior30Start, $lt: last30Start } }),

      // risk level distribution across all time
      Prediction.aggregate([
        { $group: { _id: '$riskLevel', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // delay prediction distribution
      Prediction.aggregate([
        { $group: { _id: '$delayPrediction', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // avg risk score last 30 days
      Prediction.aggregate([
        { $match: { createdAt: { $gte: last30Start } } },
        { $group: { _id: null, avg: { $avg: '$predictedRiskScore' }, min: { $min: '$predictedRiskScore' }, max: { $max: '$predictedRiskScore' } } },
      ]),

      // top 5 most-predicted projects
      Prediction.aggregate([
        { $group: { _id: '$projectId', count: { $sum: 1 }, avgRisk: { $avg: '$predictedRiskScore' } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'projects', localField: '_id', foreignField: '_id', as: 'project' } },
        { $unwind: { path: '$project', preserveNullAndEmptyArrays: true } },
        { $project: { count: 1, avgRisk: { $round: ['$avgRisk', 1] }, projectName: { $ifNull: ['$project.projectName', 'Unknown Project'] } } },
      ]),

      // daily prediction volume — last 30 days
      Prediction.aggregate([
        { $match: { createdAt: { $gte: last30Start } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          avgRisk: { $avg: '$predictedRiskScore' },
        }},
        { $sort: { _id: 1 } },
      ]),
    ]);

    const volumeTrend = predictionsPrior30 > 0
      ? (((predictionsLast30 - predictionsPrior30) / predictionsPrior30) * 100).toFixed(1)
      : null;

    res.status(200).json({
      success: true,
      data: {
        model: modelMeta ? (() => {
          const m = modelMeta.metrics;
          // Support both old key names (4-class) and new key names (binary)
          const accuracy      = m.accuracy;
          const f1            = m.f1       ?? m.f1_macro       ?? m.classification_report?.['macro avg']?.['f1-score'];
          const precision     = m.precision ?? m.precision_macro ?? m.classification_report?.['macro avg']?.precision;
          const recall        = m.recall    ?? m.recall_macro    ?? m.classification_report?.['macro avg']?.recall;
          const rocAuc        = m.roc_auc   ?? m.roc_auc_ovr    ?? null;

          return {
            name:         modelMeta.best_model,
            trainedAt:    modelMeta.trained_at,
            nSamples:     modelMeta.n_samples,
            nFeatures:    modelMeta.n_features,
            classes:      modelMeta.classes,
            accuracy:     accuracy     != null ? (accuracy     * 100).toFixed(1) : null,
            f1Macro:      f1           != null ? (f1           * 100).toFixed(1) : null,
            precisionMacro: precision  != null ? (precision    * 100).toFixed(1) : null,
            recallMacro:  recall       != null ? (recall       * 100).toFixed(1) : null,
            rocAuc:       rocAuc       != null ? (rocAuc       * 100).toFixed(1) : null,
            perClassMetrics: m.classification_report,
            featureImportances: modelMeta.feature_importances,
            allModels: (modelMeta.all_metrics || []).map(am => ({
              name:     am.model,
              accuracy: (am.accuracy * 100).toFixed(1),
              f1:       ((am.f1 ?? am.f1_macro ?? 0)         * 100).toFixed(1),
              rocAuc:   (am.roc_auc ?? am.roc_auc_ovr)
                          ? ((am.roc_auc ?? am.roc_auc_ovr)  * 100).toFixed(1)
                          : null,
            })),
          };
        })() : null,
        platform: {
          totalPredictions,
          predictionsLast30,
          predictionsPrior30,
          volumeTrendPct: volumeTrend,
          avgRiskLast30:  avgRiskLast30[0] ? {
            avg: avgRiskLast30[0].avg.toFixed(1),
            min: avgRiskLast30[0].min.toFixed(1),
            max: avgRiskLast30[0].max.toFixed(1),
          } : null,
          riskBreakdown,
          delayBreakdown,
          topProjects,
          dailyVolume,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getStats, getUsers, updateUser, deleteUser, getPerformanceMetrics };
