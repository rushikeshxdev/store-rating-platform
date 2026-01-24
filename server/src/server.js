const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
const allowedOrigins = process.env.CORS_ORIGIN === '*' 
  ? true // Allow all origins
  : process.env.NODE_ENV === 'production' 
    ? [
        'https://store-rating-platform-ruddy.vercel.app',
        'https://store-rating-platform-so19.onrender.com',
        process.env.FRONTEND_URL
      ].filter(Boolean)
    : ['http://localhost:3000'];

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);
console.log('Allowed CORS origins:', allowedOrigins);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);

// Middleware - Temporary fix for CORS
app.use(cors({
  origin: true, // Allow all origins temporarily
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// API health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Store Rating Platform API is running' });
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const storeRoutes = require('./routes/storeRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'Store Rating Platform API' });
});

// Auth routes
app.use('/api/auth', authRoutes);

// User routes
app.use('/api/users', userRoutes);

// Store routes
app.use('/api/stores', storeRoutes);

// Rating routes
app.use('/api/ratings', ratingRoutes);

// Dashboard routes
app.use('/api/dashboard', dashboardRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
