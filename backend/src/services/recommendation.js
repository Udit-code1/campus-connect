const NodeCache = require('node-cache');
const OpenAI = require('openai');
const User = require('../models/User');
const Event = require('../models/Event');
const Internship = require('../models/Internship');
const Recommendation = require('../models/Recommendation');
const {
  buildVocabulary,
  inverseDocumentFrequency,
  tfidf,
  cosineSimilarity,
  pearsonCorrelation,
} = require('./vectorUtils');

// In-memory cache (TTL: 4 hours)
const cache = new NodeCache({ stdTTL: 14400, checkperiod: 600 });

// OpenAI client (lazy initialization)
let openai = null;
const getOpenAI = () => {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
};

// ============================================================
// 1. CONTENT-BASED FILTERING
// ============================================================

/**
 * Content-based event recommendations using TF-IDF + cosine similarity
 * Matches user interests/skills against event tags
 */
const contentBasedEvents = async (user, events) => {
  if (!user.interests.length && !user.skills.length) return [];

  const userTokens = [...user.interests, ...user.skills];
  const eventDocuments = events.map((e) => e.tags || []);
  const allDocuments = [userTokens, ...eventDocuments];

  const vocabulary = buildVocabulary(allDocuments);
  const idfVector = inverseDocumentFrequency(allDocuments, vocabulary);

  const userVector = tfidf(userTokens, vocabulary, idfVector);

  const scores = events.map((event, i) => {
    const eventVector = tfidf(eventDocuments[i], vocabulary, idfVector);
    const score = cosineSimilarity(userVector, eventVector);
    return {
      itemId: event._id,
      score,
      reason: score > 0.5
        ? `Closely matches your interests in ${event.tags.filter((t) => userTokens.includes(t)).join(', ')}`
        : `Related to your interests`,
      source: 'content',
    };
  });

  return scores.filter((s) => s.score > 0.1).sort((a, b) => b.score - a.score);
};

/**
 * Content-based internship recommendations
 */
const contentBasedInternships = async (user, internships) => {
  if (!user.skills.length && !user.interests.length) return [];

  const userTokens = [...user.skills, ...user.interests];
  const internDocs = internships.map((i) => i.skills || []);
  const allDocuments = [userTokens, ...internDocs];

  const vocabulary = buildVocabulary(allDocuments);
  const idfVector = inverseDocumentFrequency(allDocuments, vocabulary);

  const userVector = tfidf(userTokens, vocabulary, idfVector);

  const scores = internships.map((intern, i) => {
    const internVector = tfidf(internDocs[i], vocabulary, idfVector);
    const score = cosineSimilarity(userVector, internVector);
    const matchingSkills = intern.skills.filter((s) => userTokens.includes(s));
    return {
      itemId: intern._id,
      score,
      reason: matchingSkills.length > 0
        ? `Your skills in ${matchingSkills.join(', ')} match this role`
        : `Aligns with your profile`,
      source: 'content',
    };
  });

  return scores.filter((s) => s.score > 0.1).sort((a, b) => b.score - a.score);
};

// ============================================================
// 2. COLLABORATIVE FILTERING
// ============================================================

/**
 * Build user-event interaction matrix and find similar users
 * Then recommend events that similar users RSVPed to
 */
const collaborativeEvents = async (user) => {
  try {
    // Get all users with RSVP history
    const events = await Event.find({ status: { $in: ['upcoming', 'ongoing'] } });
    const users = await User.find({ role: 'student' }).limit(500);

    if (users.length < 2 || events.length === 0) return [];

    // Build interaction matrix: users × events
    const eventIds = events.map((e) => e._id.toString());
    const userInteractions = {};

    users.forEach((u) => {
      userInteractions[u._id.toString()] = new Array(eventIds.length).fill(0);
    });

    // Fill matrix from event registrations
    events.forEach((event, eventIdx) => {
      event.registrations.forEach((reg) => {
        const uid = reg.user.toString();
        if (userInteractions[uid]) {
          userInteractions[uid][eventIdx] = 1;
        }
      });
    });

    const currentUserId = user._id.toString();
    const currentUserVector = userInteractions[currentUserId];
    if (!currentUserVector) return [];

    // Find top 10 similar users
    const similarities = [];
    for (const [uid, vector] of Object.entries(userInteractions)) {
      if (uid === currentUserId) continue;
      const sim = pearsonCorrelation(currentUserVector, vector);
      if (sim > 0.1) {
        similarities.push({ userId: uid, similarity: sim, vector });
      }
    }

    similarities.sort((a, b) => b.similarity - a.similarity);
    const topSimilar = similarities.slice(0, 10);

    if (topSimilar.length === 0) return [];

    // Recommend events that similar users liked but current user hasn't seen
    const recommendations = [];
    eventIds.forEach((eventId, idx) => {
      if (currentUserVector[idx] === 1) return; // Already RSVPed

      let weightedScore = 0;
      let totalSim = 0;

      topSimilar.forEach(({ similarity, vector }) => {
        if (vector[idx] === 1) {
          weightedScore += similarity;
          totalSim += Math.abs(similarity);
        }
      });

      if (totalSim > 0) {
        const score = weightedScore / totalSim;
        if (score > 0.1) {
          recommendations.push({
            itemId: eventId,
            score: Math.min(score, 1),
            reason: 'Popular among students with similar interests to you',
            source: 'collaborative',
          });
        }
      }
    });

    return recommendations.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('Collaborative filtering error:', error.message);
    return [];
  }
};

// ============================================================
// 3. AI API INTEGRATION
// ============================================================

/**
 * Use OpenAI to rank and explain recommendations
 */
const aiRecommendEvents = async (user, events) => {
  const client = getOpenAI();
  if (!client || events.length === 0) return [];

  try {
    const userProfile = {
      department: user.department,
      year: user.year,
      interests: user.interests,
      skills: user.skills,
    };

    const eventSummaries = events.slice(0, 20).map((e) => ({
      id: e._id.toString(),
      title: e.title,
      category: e.category,
      tags: e.tags,
      date: e.date,
      society: e.society,
    }));

    const prompt = `You are a campus event recommendation engine. Given a student's profile and available events, rank the top 5 most relevant events and give a one-line reason for each.

Student profile: ${JSON.stringify(userProfile)}
Available events: ${JSON.stringify(eventSummaries)}

Return ONLY a valid JSON array: [{"eventId": "...", "score": 0.0-1.0, "reason": "one-line explanation"}]`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content);
    const results = Array.isArray(parsed) ? parsed : parsed.recommendations || [];

    return results.map((r) => ({
      itemId: r.eventId,
      score: Math.min(Math.max(r.score || 0.5, 0), 1),
      reason: r.reason || 'AI-recommended based on your profile',
      source: 'ai',
    }));
  } catch (error) {
    console.error('AI recommendation error:', error.message);
    return [];
  }
};

/**
 * Use OpenAI to rank internship recommendations
 */
const aiRecommendInternships = async (user, internships) => {
  const client = getOpenAI();
  if (!client || internships.length === 0) return [];

  try {
    const userProfile = {
      department: user.department,
      year: user.year,
      skills: user.skills,
      interests: user.interests,
    };

    const internSummaries = internships.slice(0, 20).map((i) => ({
      id: i._id.toString(),
      company: i.company,
      role: i.role,
      skills: i.skills,
      type: i.type,
      duration: i.duration,
    }));

    const prompt = `You are a career recommendation engine. Given a student's profile and available internships, rank the top 5 most suitable internships and give a one-line reason for each.

Student profile: ${JSON.stringify(userProfile)}
Available internships: ${JSON.stringify(internSummaries)}

Return ONLY a valid JSON array: [{"internshipId": "...", "score": 0.0-1.0, "reason": "one-line explanation"}]`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content);
    const results = Array.isArray(parsed) ? parsed : parsed.recommendations || [];

    return results.map((r) => ({
      itemId: r.internshipId,
      score: Math.min(Math.max(r.score || 0.5, 0), 1),
      reason: r.reason || 'AI-recommended based on your skills',
      source: 'ai',
    }));
  } catch (error) {
    console.error('AI internship recommendation error:', error.message);
    return [];
  }
};

// ============================================================
// HYBRID RECOMMENDATION ENGINE
// ============================================================

const WEIGHTS = {
  content: 0.3,
  collaborative: 0.3,
  ai: 0.4,
};

/**
 * Blend scores from multiple recommendation sources
 */
const blendScores = (sources, maxResults = 10) => {
  const scoreMap = {};

  sources.forEach(({ results, weight }) => {
    results.forEach(({ itemId, score, reason, source }) => {
      const id = itemId.toString();
      if (!scoreMap[id]) {
        scoreMap[id] = { itemId: id, totalScore: 0, reasons: [], sources: [] };
      }
      scoreMap[id].totalScore += score * weight;
      scoreMap[id].reasons.push(reason);
      scoreMap[id].sources.push(source);
    });
  });

  return Object.values(scoreMap)
    .map((item) => ({
      itemId: item.itemId,
      score: Math.min(item.totalScore, 1),
      reason: item.reasons[0], // Use the best reason
      source: item.sources.length > 1 ? 'hybrid' : item.sources[0],
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
};

/**
 * Get hybrid event recommendations for a user
 */
const getEventRecommendations = async (userId) => {
  // Check cache
  const cacheKey = `rec:events:${userId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  // Get upcoming events
  const events = await Event.find({
    status: { $in: ['upcoming', 'ongoing'] },
    'registrations.user': { $ne: userId }, // Exclude already registered
  }).sort({ date: 1 });

  if (events.length === 0) return [];

  // Run all three recommendation engines in parallel
  const [contentResults, collabResults, aiResults] = await Promise.all([
    contentBasedEvents(user, events),
    collaborativeEvents(user),
    aiRecommendEvents(user, events),
  ]);

  const blended = blendScores([
    { results: contentResults, weight: WEIGHTS.content },
    { results: collabResults, weight: WEIGHTS.collaborative },
    { results: aiResults, weight: WEIGHTS.ai },
  ]);

  // Populate event details
  const eventIds = blended.map((r) => r.itemId);
  const eventDetails = await Event.find({ _id: { $in: eventIds } })
    .populate('createdBy', 'name societyName avatar');

  const eventMap = {};
  eventDetails.forEach((e) => {
    eventMap[e._id.toString()] = e;
  });

  const recommendations = blended
    .filter((r) => eventMap[r.itemId])
    .map((r) => ({
      ...r,
      event: eventMap[r.itemId],
    }));

  // Cache results
  cache.set(cacheKey, recommendations);

  // Also persist to DB for analytics
  try {
    const recDocs = recommendations.map((r) => ({
      userId,
      type: 'event',
      itemId: r.itemId,
      score: r.score,
      reason: r.reason,
      source: r.source,
    }));
    await Recommendation.insertMany(recDocs, { ordered: false }).catch(() => {});
  } catch {
    // Non-critical — don't fail the request
  }

  return recommendations;
};

/**
 * Get hybrid internship recommendations for a user
 */
const getInternshipRecommendations = async (userId) => {
  // Check cache
  const cacheKey = `rec:internships:${userId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  // Get active internships user hasn't applied to
  const appliedIds = user.applicationHistory.map((a) => a.internship);
  const internships = await Internship.find({
    status: 'active',
    deadline: { $gt: new Date() },
    _id: { $nin: appliedIds },
  }).sort({ deadline: 1 });

  if (internships.length === 0) return [];

  // Run content-based and AI recommendations
  const [contentResults, aiResults] = await Promise.all([
    contentBasedInternships(user, internships),
    aiRecommendInternships(user, internships),
  ]);

  const blended = blendScores([
    { results: contentResults, weight: 0.5 },
    { results: aiResults, weight: 0.5 },
  ]);

  // Populate internship details
  const internIds = blended.map((r) => r.itemId);
  const internDetails = await Internship.find({ _id: { $in: internIds } })
    .select('-applicants')
    .populate('postedBy', 'name');

  const internMap = {};
  internDetails.forEach((i) => {
    internMap[i._id.toString()] = i;
  });

  const recommendations = blended
    .filter((r) => internMap[r.itemId])
    .map((r) => ({
      ...r,
      internship: internMap[r.itemId],
    }));

  // Cache results
  cache.set(cacheKey, recommendations);

  return recommendations;
};

/**
 * Invalidate cache for a user
 */
const invalidateCache = (userId) => {
  cache.del(`rec:events:${userId}`);
  cache.del(`rec:internships:${userId}`);
};

module.exports = {
  getEventRecommendations,
  getInternshipRecommendations,
  invalidateCache,
  // Exported for testing
  contentBasedEvents,
  contentBasedInternships,
  collaborativeEvents,
  blendScores,
};
