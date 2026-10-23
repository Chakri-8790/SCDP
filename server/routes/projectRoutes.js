const express = require('express');
const router = express.Router();
const {
  getProjects, getProject, createProject,
  updateProject, deleteProject, getProjectCount,
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');
const { projectValidation } = require('../middleware/validationMiddleware');

router.use(protect);

router.get('/count', getProjectCount);
router.route('/').get(getProjects).post(projectValidation, createProject);
router.route('/:id').get(getProject).put(updateProject).delete(deleteProject);

module.exports = router;
