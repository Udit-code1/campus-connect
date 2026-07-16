const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('./config/passport');

// Route imports
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const internshipRoutes = require('./routes/internships');
const userRoutes = require('./routes/users');
const recommendRoutes = require('./routes/recommend');
const notificationRoutes = require('./routes/notifications');

// Middleware imports
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// ──────────────────────────────────────────────
// Security & Parsing Middleware
// ──────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ──────────────────────────────────────────────
// Logging
// ──────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ──────────────────────────────────────────────
// Passport (Google OAuth)
// ──────────────────────────────────────────────
app.use(passport.initialize());

// ──────────────────────────────────────────────
// Health Check
// ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Campus Connect API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ──────────────────────────────────────────────
// API Routes
// ──────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/users', userRoutes);
app.use('/api/recommendations', recommendRoutes);
app.use('/api/notifications', notificationRoutes);

// ──────────────────────────────────────────────
// Error Handling
// ──────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
