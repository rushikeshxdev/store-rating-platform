const express = require('express');
const UserController = require('../controllers/UserController');
const { authenticate, authorize } = require('../middleware');

const router = express.Router();
const userController = new UserController();

// Admin only - create user
router.post('/', authenticate, authorize('SYSTEM_ADMIN'), (req, res) => 
  userController.createUser(req, res)
);

// Admin only - get all users
router.get('/', authenticate, authorize('SYSTEM_ADMIN'), (req, res) => 
  userController.getAllUsers(req, res)
);

// Admin only - get user by ID
router.get('/:id', authenticate, authorize('SYSTEM_ADMIN'), (req, res) => 
  userController.getUserById(req, res)
);

// Authenticated users - update password
router.put('/:id/password', authenticate, (req, res) => 
  userController.updatePassword(req, res)
);

module.exports = router;
