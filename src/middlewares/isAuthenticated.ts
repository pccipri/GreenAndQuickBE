import { Request, Response, NextFunction } from 'express';
import { IUser } from '@/models/IUser';
import passport from '../config/passport';

export const requireAuth = passport.authenticate('jwt', { session: false });

export const requireActiveUser = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ error: 'auth.unauthorized' });
  if (!req.user.isActive) return res.status(403).json({ error: 'auth.userNotActive' });
  next();
};

export const requireRole =
  (roles: Array<IUser['role']>) => (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'auth.unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'auth.forbidden' });
    }
    next();
  };
