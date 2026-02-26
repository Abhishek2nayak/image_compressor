import { Router, type IRouter } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { authController } from './auth.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { authRateLimiter } from '../../middleware/rateLimiter.middleware';
import { authService } from './auth.service';
import { env } from '../../config/env';
import { signAccessToken, signRefreshToken } from '../../middleware/auth.middleware';

// Configure Google OAuth if credentials are provided
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: `http://localhost:${env.PORT}/api/v1/auth/google/callback`,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('No email from Google'), undefined);
          const user = await authService.findOrCreateGoogleUser({
            id: profile.id,
            email,
            name: profile.displayName,
          });
          done(null, user);
        } catch (err) {
          done(err as Error, undefined);
        }
      },
    ),
  );
}

passport.serializeUser((user: Express.User, done) => done(null, user));
passport.deserializeUser((user: Express.User, done) => done(null, user));

const router: IRouter = Router();

router.post('/register', authRateLimiter, authController.register);
router.post('/login', authRateLimiter, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, authController.me);

// Google OAuth routes
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false }),
);
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const user = req.user as { id: string };
    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);
    const frontendUrl = env.FRONTEND_URL;
    res.redirect(`${frontendUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
  },
);

export default router;
