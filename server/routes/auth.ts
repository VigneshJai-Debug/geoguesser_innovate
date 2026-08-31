import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';

export const authRouter = Router();

// ---------------------------------------------------------------------------
// POST /api/auth/login
// Credentials: teamName (team name) + password (teamname_last4reg format)
// Only the Team Lead logs in — no individual member accounts.
// ---------------------------------------------------------------------------

authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { teamName, password } = req.body;

    if (
      !teamName ||
      !password ||
      typeof teamName !== 'string' ||
      typeof password !== 'string'
    ) {
      res.status(400).json({ error: 'Team name and password are required.' });
      return;
    }

    const team = await prisma.team.findUnique({
      where: { teamName: teamName.trim() },
      select: {
        id: true,
        teamName: true,
        passwordHash: true,
        setId: true,
      },
    });

    if (!team) {
      res.status(401).json({ error: 'Invalid team name or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, team.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid team name or password.' });
      return;
    }

    req.session.teamId = team.id;
    req.session.teamName = team.teamName;

    res.json({
      success: true,
      team: {
        id: team.id,
        teamName: team.teamName,
        setId: team.setId,
      },
    });
  } catch (err) {
    console.error('[POST /auth/login]', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------

authRouter.post('/logout', (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      console.error('[POST /auth/logout]', err);
      res.status(500).json({ error: 'Failed to log out.' });
      return;
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// ---------------------------------------------------------------------------
// GET /api/auth/me
// Returns current authenticated team, or { authenticated: false }.
// ---------------------------------------------------------------------------

authRouter.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.session?.teamId) {
      res.json({ authenticated: false });
      return;
    }

    const team = await prisma.team.findUnique({
      where: { id: req.session.teamId },
      select: {
        id: true,
        teamName: true,
        setId: true,
      },
    });

    if (!team) {
      req.session.destroy(() => {});
      res.json({ authenticated: false });
      return;
    }

    res.json({ authenticated: true, team });
  } catch (err) {
    console.error('[GET /auth/me]', err);
    res.status(500).json({ error: 'Failed to verify session.' });
  }
});
