const express = require('express');
const RatingController = require('../controllers/RatingController');
const { authenticate, authorize } = require('../middleware');

const router = express.Router();
const ratingController = new RatingController();

// Normal users only - create rating
router.post('/', authenticate, authorize('NORMAL_USER'), (req, res) => 
  ratingController.createRating(req, res)
);

// Normal users only - update rating
router.put('/:id', authenticate, authorize('NORMAL_USER'), (req, res) => 
  ratingController.updateRating(req, res)
);

// Store owners (and admins) - get ratings for a store
router.get('/store/:storeId', authenticate, authorize('STORE_OWNER', 'SYSTEM_ADMIN'), (req, res) => 
  ratingController.getRatingsForStore(req, res)
);

module.exports = router;
