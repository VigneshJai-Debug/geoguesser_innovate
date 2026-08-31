import { Request, Response, NextFunction } from 'express';

// Extend Express Session interface
declare module 'express-session' {
  interface SessionData {
    teamId?: string;
    teamName?: string;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session || !req.session.teamId) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }
  next();
}
