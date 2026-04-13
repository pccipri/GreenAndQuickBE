import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { isPasswordValid } from '../utils/encryption';
import { User } from '../schemas/UserSchema';
import { getUserById } from '../services/UserService';
import { configEnvs } from './env';
// Local strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: 'usernameOrEmail',
      passwordField: 'password',
    },
    async (usernameOrEmail: string, password: string, done) => {
      try {
        const user = await User.findOne({
          $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
        });

        if (!user) return done(null, false, { message: 'Incorrect username/email' });

        const valid = await isPasswordValid(password, user.password);
        if (!valid) return done(null, false, { message: 'Invalid password' });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

passport.use(
  new GoogleStrategy(
    {
      clientID: configEnvs.GOOGLE_CLIENT_ID,
      clientSecret: configEnvs.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:8080/api/auth/google/callback',
    },
    async (_accessToken, _refreshToken, profile: Profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        if (!email) return done(new Error('No email from Google'));

        // 1. Check if a user with this googleId already exists
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // 2. Check if an account with that email exists (link it)
          user = await User.findOne({ email });

          if (user) {
            user.googleId = profile.id;
            await user.save();
          } else {
            // 3. Brand new user — create them
            user = await User.create({
              googleId: profile.id,
              role: 'user',
              email,
              isVerified: true,
              username: profile.displayName,
            });
          }
        }

        return done(null, user);
      } catch (err) {
        return done(err as Error);
      }
    },
  ),
);

// JWT strategy
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configEnvs.ACCESS_SECRET,
    },
    async (payload, done) => {
      try {
        if (!payload?.sub) return done(null, false);
        const user = await User.findById(payload.sub).select('-password');
        if (!user) return done(null, false);
        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    },
  ),
);
export default passport;
