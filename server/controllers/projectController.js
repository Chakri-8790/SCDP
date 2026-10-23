const Project = require('../models/Project');
const Prediction = require('../models/Prediction');

// @desc  Get all projects for user
// @route GET /api/projects
const getProjects = async (req, res, next) => {
  try {
    const { search, status, sort = '-createdAt', page = 1, limit = 20 } = req.query;

    const query = { userId: req.user._id };
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { projectName: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { manager: { $regex: search, $options: 'i' } },
        { projectId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('latestPrediction', 'delayPrediction delayProbability predictedRiskScore riskLevel createdAt');

    res.status(200).json({
      success: true,
      data: {
        projects,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Get single project
// @route GET /api/projects/:id
const getProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('latestPrediction');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Get recent predictions
    const recentPredictions = await Prediction.find({ projectId: project._id })
      .sort('-createdAt')
      .limit(5)
      .select('delayPrediction delayProbability predictedRiskScore riskLevel createdAt isMock');

    res.status(200).json({
      success: true,
      data: { project, recentPredictions },
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Create project
// @route POST /api/projects
const createProject = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // ── 20-project per-user limit ──────────────────────────────
    const existingCount = await Project.countDocuments({ userId });
    if (existingCount >= 20) {
      return res.status(400).json({
        success: false,
        message: 'Project limit reached. You can have a maximum of 20 projects. Please delete an existing project to create a new one.',
      });
    }

    // ── Duplicate name detection ───────────────────────────────
    const trimmedName = (req.body.projectName || '').trim();
    const duplicate = await Project.findOne({
      userId,
      projectName: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: `A project named "${duplicate.projectName}" already exists. Please use a unique name.`,
      });
    }

    const project = await Project.create({ ...req.body, projectName: trimmedName, userId });
    res.status(201).json({ success: true, data: { project } });
  } catch (error) {
    next(error);
  }
};

// @desc  Update project
// @route PUT /api/projects/:id
const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.status(200).json({ success: true, data: { project } });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete project
// @route DELETE /api/projects/:id
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Delete related predictions
    await Prediction.deleteMany({ projectId: req.params.id });

    res.status(200).json({ success: true, data: {}, message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc  Get project count for current user
// @route GET /api/projects/count
const getProjectCount = async (req, res, next) => {
  try {
    const count = await Project.countDocuments({ userId: req.user._id });
    res.status(200).json({ success: true, data: { count, limit: 20 } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProjects, getProject, createProject, updateProject, deleteProject, getProjectCount };
