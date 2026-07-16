const cron = require('node-cron');
const User = require('../models/User');
const {
  getEventRecommendations,
  getInternshipRecommendations,
  invalidateCache,
} = require('../services/recommendation');

/**
 * Start all background cron jobs
 */
const startCronJobs = () => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  console.log('⏰ Starting background cron scheduler...');

  // Nightly recommendation precomputation at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('🔄 Cron: Starting nightly recommendation precomputation...');
    try {
      // Find active student users (e.g. updated in the last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const activeStudents = await User.find({
        role: 'student',
        updatedAt: { $gte: thirtyDaysAgo },
      });

      console.log(`🔄 Cron: Found ${activeStudents.length} active students to precompute.`);

      for (const student of activeStudents) {
        try {
          // Clear cached recommendations
          invalidateCache(student._id);

          // Force-generate new recommendations (this will cache them in memory and save to DB)
          await getEventRecommendations(student._id);
          await getInternshipRecommendations(student._id);
        } catch (itemErr) {
          console.error(`❌ Cron: Failed precomputation for user ${student._id}: ${itemErr.message}`);
        }
      }

      console.log('✅ Cron: Nightly recommendation precomputation finished successfully.');
    } catch (error) {
      console.error('❌ Cron: Nightly recommendation precomputation error:', error);
    }
  });

  // Database cleanup of expired recommendations daily at 3 AM
  cron.schedule('0 3 * * *', async () => {
    console.log('🧹 Cron: Starting database cleanup of expired recommendations...');
    try {
      const Recommendation = require('../models/Recommendation');
      const result = await Recommendation.deleteMany({
        expiresAt: { $lte: new Date() },
      });
      console.log(`🧹 Cron: Deleted ${result.deletedCount} expired recommendation records.`);
    } catch (error) {
      console.error('❌ Cron: Expired recommendation cleanup error:', error);
    }
  });
};

module.exports = { startCronJobs };
