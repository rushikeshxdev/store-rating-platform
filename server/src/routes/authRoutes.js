const express = require('express');
const AuthController = require('../controllers/AuthController');
const { authenticate } = require('../middleware');

const router = express.Router();
const authController = new AuthController();

// Public routes
router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));
router.post('/logout', (req, res) => authController.logout(req, res));

// Protected routes
router.get('/me', authenticate, (req, res) => authController.me(req, res));

module.exports = router;
