const express = require('express');
const router = express.Router();
const {
  createPrediction,
  getPredictions,
  getPrediction,
  deletePrediction,
} = require('../controllers/predictionController');
const { protect } = require('../middleware/authMiddleware');
const { predictionValidation } = require('../middleware/validationMiddleware');

router.use(protect);

router.route('/').get(getPredictions).post(predictionValidation, createPrediction);
router.route('/:id').get(getPrediction).delete(deletePrediction);

module.exports = router;
