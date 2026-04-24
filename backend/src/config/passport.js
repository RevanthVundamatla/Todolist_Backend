import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/userModel.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          const existingUser = await User.findOne({ email });

          if (existingUser) {
            existingUser.googleId = profile.id;
            existingUser.authProvider = 'google';
            existingUser.isVerified = true;
            await existingUser.save();
            return done(null, existingUser);
          }

          user = await User.create({
            name: profile.displayName,
            email,
            googleId: profile.id,
            authProvider: 'google',
            isPremium: false,
            isVerified: true,
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export default passport;
