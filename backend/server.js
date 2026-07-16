require('dotenv').config();

const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { initializeSocket } = require('./src/sockets');
const { startCronJobs } = require('./src/utils/cron');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  // Create HTTP server
  const server = http.createServer(app);

  // Initialize Socket.io
  const io = initializeSocket(server);

  // Make io accessible in routes via req.app
  app.set('io', io);

  // Start cron jobs (recommendation recomputation, etc.)
  startCronJobs();

  server.listen(PORT, () => {
    console.log(`\n🚀 Campus Connect API running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health\n`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
