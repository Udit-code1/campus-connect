const {
  getEventRecommendations,
  getInternshipRecommendations,
} = require('../services/recommendation');

/**
 * GET /api/recommend/events
 * Get AI-powered event recommendations for current user
 */
const recommendEvents = async (req, res, next) => {
  try {
    const recommendations = await getEventRecommendations(req.user._id);

    res.json({
      success: true,
      data: {
        recommendations,
        count: recommendations.length,
        cached: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/recommend/internships
 * Get AI-powered internship recommendations for current user
 */
const recommendInternships = async (req, res, next) => {
  try {
    const recommendations = await getInternshipRecommendations(req.user._id);

    res.json({
      success: true,
      data: {
        recommendations,
        count: recommendations.length,
        cached: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recommendEvents,
  recommendInternships,
};
