const express = require('express');
const DashboardController = require('../controllers/DashboardController');
const { authenticate, authorize } = require('../middleware');

const router = express.Router();
const dashboardController = new DashboardController();

// Admin dashboard - requires SYSTEM_ADMIN role
router.get('/admin', 
  authenticate, 
  authorize('SYSTEM_ADMIN'), 
  (req, res) => dashboardController.getAdminDashboard(req, res)
);

// Store owner dashboard - requires STORE_OWNER role
router.get('/owner', 
  authenticate, 
  authorize('STORE_OWNER'), 
  (req, res) => dashboardController.getOwnerDashboard(req, res)
);

module.exports = router;
