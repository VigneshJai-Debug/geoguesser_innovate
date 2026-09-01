import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session || !req.session.teamId) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }
  next();
}
