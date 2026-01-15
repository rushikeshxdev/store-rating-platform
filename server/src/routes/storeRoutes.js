const express = require('express');
const StoreController = require('../controllers/StoreController');
const { authenticate, authorize } = require('../middleware');

const router = express.Router();
const storeController = new StoreController();

// Admin only - create store
router.post('/', authenticate, authorize('SYSTEM_ADMIN'), (req, res) => 
  storeController.createStore(req, res)
);

// Authenticated users - get all stores
router.get('/', authenticate, (req, res) => 
  storeController.getAllStores(req, res)
);

// Authenticated users - get store by ID
router.get('/:id', authenticate, (req, res) => 
  storeController.getStoreById(req, res)
);

module.exports = router;
