const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    projectName: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [200, 'Project name cannot exceed 200 characters'],
    },
    projectId: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    manager: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
    },
    expectedEndDate: {
      type: Date,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Planning', 'In Progress', 'At Risk', 'Delayed', 'Completed'],
      default: 'Planning',
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    budget: {
      type: Number,
      min: 0,
    },
    latestPrediction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prediction',
    },
  },
  { timestamps: true }
);

// Virtual for total predictions count (populated when needed)
ProjectSchema.virtual('predictionsCount', {
  ref: 'Prediction',
  localField: '_id',
  foreignField: 'projectId',
  count: true,
});

module.exports = mongoose.model('Project', ProjectSchema);
