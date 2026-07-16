const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        // Optionally restrict to college email domain
        const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN;
        if (allowedDomain && !email.endsWith(`@${allowedDomain}`)) {
          return done(null, false, {
            message: `Only @${allowedDomain} emails are allowed`,
          });
        }

        // Find existing user or create new one
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // Check if user exists with same email (registered manually)
          user = await User.findOne({ email });

          if (user) {
            // Link Google account to existing user
            user.googleId = profile.id;
            user.avatar = user.avatar || profile.photos[0]?.value;
            await user.save();
          } else {
            // Create new user
            user = await User.create({
              name: profile.displayName,
              email,
              googleId: profile.id,
              avatar: profile.photos[0]?.value,
              role: 'student', // Default role for OAuth signups
            });
          }
        }

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

module.exports = passport;
