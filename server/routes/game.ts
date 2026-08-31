import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import {
  ROUND_TIME_LIMIT_MS,
  ROUND_1_TOTAL_QUESTIONS,
  CURRENT_TOTAL_ROUNDS,
  ROUND_2_SECRET_ANSWER,
  calculateCompletionScore,
} from '../constants/game.js';

export const gameRouter = Router();

// Apply auth requirement to all game endpoints
gameRouter.use(requireAuth);

/**
 * Helper to ensure GameState exists in DB
 */
async function getOrCreateGameState() {
  let gameState = await prisma.gameState.findUnique({ where: { id: 1 } });
  if (!gameState) {
    gameState = await prisma.gameState.create({
      data: { id: 1, activeRound: 1 },
    });
  }
  return gameState;
}

/**
 * Helper to check and expire active rounds whose 30-minute timer has elapsed,
 * or rounds that are older than the current globally active round.
 */
async function updateExpiredRounds(teamId: string, globalActiveRound: number) {
  const now = new Date();
  const progresses = await prisma.roundProgress.findMany({
    where: { teamId },
  });

  for (const progress of progresses) {
    if (progress.status === 'ACTIVE') {
      const elapsed = now.getTime() - new Date(progress.startedAt).getTime();
      const isPastTime = elapsed > ROUND_TIME_LIMIT_MS;
      const isPastRound = progress.roundNumber < globalActiveRound;

      if (isPastTime || isPastRound) {
        await prisma.roundProgress.update({
          where: { id: progress.id },
          data: {
            status: 'TIMED_OUT',
            score: 0,
            completionNumber: null,
            completedAt: now,
          },
        });
      }
    }
  }
}

// GET /api/game/state
// Returns full state of the game, current active round, team progress, and total score
gameRouter.get('/state', async (req: Request, res: Response): Promise<void> => {
  try {
    const teamId = req.session.teamId!;
    const gameState = await getOrCreateGameState();

    // Check for any expired / timed-out active rounds
    await updateExpiredRounds(teamId, gameState.activeRound);

    const roundProgresses = await prisma.roundProgress.findMany({
      where: { teamId },
      orderBy: { roundNumber: 'asc' },
    });

    const now = new Date().getTime();
    const progressWithTimer = roundProgresses.map((rp) => {
      let timeRemainingMs = 0;
      if (rp.status === 'ACTIVE') {
        const elapsed = now - new Date(rp.startedAt).getTime();
        timeRemainingMs = Math.max(0, ROUND_TIME_LIMIT_MS - elapsed);
      }
      return {
        ...rp,
        timeRemainingMs,
      };
    });

    const totalScore = roundProgresses.reduce((sum, rp) => sum + (rp.score || 0), 0);

    res.json({
      activeRound: gameState.activeRound,
      currentTotalRounds: CURRENT_TOTAL_ROUNDS,
      teamProgress: progressWithTimer,
      totalScore,
    });
  } catch (error) {
    console.error('Error fetching game state:', error);
    res.status(500).json({ error: 'Failed to load game state.' });
  }
});

// POST /api/game/round/enter
// Enters the globally active round for the team. Assigns question if Round 1 and not yet assigned.
gameRouter.post('/round/enter', async (req: Request, res: Response): Promise<void> => {
  try {
    const teamId = req.session.teamId!;
    const gameState = await getOrCreateGameState();
    const activeRound = gameState.activeRound;

    await updateExpiredRounds(teamId, activeRound);

    let progress = await prisma.roundProgress.findUnique({
      where: {
        teamId_roundNumber: {
          teamId,
          roundNumber: activeRound,
        },
      },
    });

    if (!progress) {
      // First time entering this round
      let assignedQuestionId: number | null = null;
      if (activeRound === 1) {
        // Randomly pick a question 1..5 server-side
        assignedQuestionId = Math.floor(Math.random() * ROUND_1_TOTAL_QUESTIONS) + 1;
      }

      progress = await prisma.roundProgress.create({
        data: {
          teamId,
          roundNumber: activeRound,
          status: 'ACTIVE',
          assignedQuestionId,
          startedAt: new Date(),
        },
      });
    }

    const elapsed = Date.now() - new Date(progress.startedAt).getTime();
    const timeRemainingMs = Math.max(0, ROUND_TIME_LIMIT_MS - elapsed);

    res.json({
      success: true,
      activeRound,
      progress: {
        ...progress,
        timeRemainingMs,
      },
    });
  } catch (error) {
    console.error('Error entering round:', error);
    res.status(500).json({ error: 'Failed to access round.' });
  }
});

// POST /api/game/round1/complete
// Completes Round 1 with concurrency-safe ranking
gameRouter.post('/round1/complete', async (req: Request, res: Response): Promise<void> => {
  try {
    const teamId = req.session.teamId!;
    const roundNumber = 1;

    // Use Prisma transaction for concurrency-safe completion ranking
    const result = await prisma.$transaction(async (tx) => {
      const gameState = await tx.gameState.findUnique({ where: { id: 1 } });
      if (!gameState || gameState.activeRound !== roundNumber) {
        throw new Error('Round 1 is no longer the active round.');
      }

      const progress = await tx.roundProgress.findUnique({
        where: {
          teamId_roundNumber: { teamId, roundNumber },
        },
      });

      if (!progress) {
        throw new Error('Round 1 has not been started.');
      }

      if (progress.status === 'COMPLETED') {
        return { alreadyCompleted: true, progress };
      }

      if (progress.status === 'TIMED_OUT') {
        throw new Error('Round 1 has timed out.');
      }

      const now = new Date();
      const elapsed = now.getTime() - new Date(progress.startedAt).getTime();
      if (elapsed > ROUND_TIME_LIMIT_MS) {
        // Time expired
        const timedOut = await tx.roundProgress.update({
          where: { id: progress.id },
          data: {
            status: 'TIMED_OUT',
            score: 0,
            completionNumber: null,
            completedAt: now,
          },
        });
        return { timedOut: true, progress: timedOut };
      }

      // Concurrency-safe: count completed teams for this round
      const completedCount = await tx.roundProgress.count({
        where: {
          roundNumber,
          status: 'COMPLETED',
        },
      });

      const completionNumber = completedCount + 1;
      const score = calculateCompletionScore(completionNumber);

      const completed = await tx.roundProgress.update({
        where: { id: progress.id },
        data: {
          status: 'COMPLETED',
          completionNumber,
          score,
          completedAt: now,
        },
      });

      return { completed: true, progress: completed };
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error completing Round 1:', error);
    res.status(400).json({ error: error.message || 'Failed to complete Round 1.' });
  }
});

// POST /api/game/round2/submit
// Submits an answer for Round 2 (Cipher Challenge). Validates answer server-side.
gameRouter.post('/round2/submit', async (req: Request, res: Response): Promise<void> => {
  try {
    const teamId = req.session.teamId!;
    const roundNumber = 2;
    const { answer } = req.body;

    if (!answer || typeof answer !== 'string') {
      res.status(400).json({ error: 'Answer is required.' });
      return;
    }

    // Clean answer (trim and lowercase)
    const normalizedInput = answer.trim().toLowerCase();
    const normalizedSecret = ROUND_2_SECRET_ANSWER.trim().toLowerCase();

    if (normalizedInput !== normalizedSecret) {
      res.json({
        correct: false,
        message: 'Incorrect cipher solution. Try again.',
      });
      return;
    }

    // Answer is correct, complete round in transaction
    const result = await prisma.$transaction(async (tx) => {
      const gameState = await tx.gameState.findUnique({ where: { id: 1 } });
      if (!gameState || gameState.activeRound !== roundNumber) {
        throw new Error('Round 2 is no longer the active round.');
      }

      const progress = await tx.roundProgress.findUnique({
        where: {
          teamId_roundNumber: { teamId, roundNumber },
        },
      });

      if (!progress) {
        throw new Error('Round 2 has not been started.');
      }

      if (progress.status === 'COMPLETED') {
        return { alreadyCompleted: true, progress };
      }

      if (progress.status === 'TIMED_OUT') {
        throw new Error('Round 2 has timed out.');
      }

      const now = new Date();
      const elapsed = now.getTime() - new Date(progress.startedAt).getTime();
      if (elapsed > ROUND_TIME_LIMIT_MS) {
        const timedOut = await tx.roundProgress.update({
          where: { id: progress.id },
          data: {
            status: 'TIMED_OUT',
            score: 0,
            completionNumber: null,
            completedAt: now,
          },
        });
        return { timedOut: true, progress: timedOut };
      }

      const completedCount = await tx.roundProgress.count({
        where: {
          roundNumber,
          status: 'COMPLETED',
        },
      });

      const completionNumber = completedCount + 1;
      const score = calculateCompletionScore(completionNumber);

      const completed = await tx.roundProgress.update({
        where: { id: progress.id },
        data: {
          status: 'COMPLETED',
          completionNumber,
          score,
          completedAt: now,
        },
      });

      return { completed: true, progress: completed };
    });

    res.json({
      correct: true,
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error completing Round 2:', error);
    res.status(400).json({ error: error.message || 'Failed to submit Round 2 answer.' });
  }
});
