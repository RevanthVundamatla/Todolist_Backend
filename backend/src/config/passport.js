import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        'http://localhost:5000/api/auth/google/callback',
      proxy: true, // Important for Render/production deployments
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        if (!profile?.emails?.[0]?.value) {
          return done(new Error('Google account email not available.'), null);
        }

        const email = profile.emails[0].value.toLowerCase();

        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          const existingUser = await User.findOne({ email });

          if (existingUser) {
            existingUser.googleId = profile.id;
            existingUser.authProvider = 'google';

            if (!existingUser.name && profile.displayName) {
              existingUser.name = profile.displayName;
            }

            await existingUser.save();
            return done(null, existingUser);
          }

          user = await User.create({
            name: profile.displayName || 'Google User',
            email,
            googleId: profile.id,
            authProvider: 'google',
            isPremium: false,
          });
        } else {
          // Keep profile data up to date
          if (user.email !== email) {
            user.email = email;
          }

          if (profile.displayName && user.name !== profile.displayName) {
            user.name = profile.displayName;
          }

          user.authProvider = 'google';
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        console.error('Google OAuth Error:', error);
        return done(error, null);
      }
    }
  )
);

export default passport;
