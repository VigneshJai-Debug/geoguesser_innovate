import { Router, Request, Response } from 'express';
import multer from 'multer';
import { put } from '@vercel/blob';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { EVENT_2_TOTAL_QUESTIONS, EVENT_3_ANSWERS } from '../constants/game.js';
import { timeRemainingMs } from '../lib/timer.js';
import {
  getOrCreateEventProgress,
  expireIfPastDeadline,
  completeEvent,
} from '../lib/eventProgress.js';

const upload = multer({ storage: multer.memoryStorage() });

export const eventsRouter = Router();

eventsRouter.use(requireAuth);

async function getGameState() {
  let gs = await prisma.gameState.findUnique({ where: { id: 1 } });
  if (!gs) {
    gs = await prisma.gameState.create({
      data: { id: 1, activeEventNumber: 1, eventOpen: true },
    });
  }
  return gs;
}

eventsRouter.get('/state', async (req: Request, res: Response): Promise<void> => {
  try {
    const teamId = req.session.teamId!;
    const gameState = await getGameState();

    const progresses = await prisma.eventProgress.findMany({
      where: { teamId },
      orderBy: { eventNumber: 'asc' },
    });

    const now = Date.now();
    const progressWithTimer = progresses.map((ep) => ({
      ...ep,
      timeRemainingMs:
        ep.status === 'ACTIVE'
          ? Math.max(0, ep.deadlineAt.getTime() - now)
          : 0,
    }));

    const totalScore = progresses.reduce((sum, ep) => sum + (ep.score ?? 0), 0);

    res.json({
      activeEventNumber: gameState.activeEventNumber,
      eventOpen: gameState.eventOpen,
      eventProgress: progressWithTimer,
      totalScore,
    });
  } catch (err) {
    console.error('[GET /events/state]', err);
    res.status(500).json({ error: 'Failed to load game state.' });
  }
});

eventsRouter.post('/enter', async (req: Request, res: Response): Promise<void> => {
  try {
    const teamId = req.session.teamId!;
    const gameState = await getGameState();

    if (!gameState.eventOpen) {
      res.status(403).json({ error: 'This event is currently closed.' });
      return;
    }

    const eventNumber = gameState.activeEventNumber;

    const progress = await prisma.$transaction(async (tx) => {
      let assignedQuestionId: number | undefined;

      const existing = await tx.eventProgress.findUnique({
        where: { teamId_eventNumber: { teamId, eventNumber } },
      });

      // Event 2 is GeoGuesser
      if (!existing && eventNumber === 2) {
        assignedQuestionId = Math.floor(Math.random() * EVENT_2_TOTAL_QUESTIONS) + 1;
      }

      return getOrCreateEventProgress(tx, teamId, eventNumber, { assignedQuestionId });
    });

    res.json({
      success: true,
      eventNumber,
      progress: {
        ...progress,
        timeRemainingMs: timeRemainingMs(progress.deadlineAt),
      },
    });
  } catch (err) {
    console.error('[POST /events/enter]', err);
    res.status(500).json({ error: 'Failed to enter event.' });
  }
});

// Event 1 File Upload
eventsRouter.post('/upload', upload.single('screenshot'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded.' });
      return;
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      // For local testing without Vercel Blob token, just mock the URL
      console.warn("No BLOB_READ_WRITE_TOKEN, returning mock URL");
      res.json({ url: 'https://mock-vercel-blob-url.com/mock-screenshot.png' });
      return;
    }

    const blob = await put(`event1/${req.session.teamId}-${Date.now()}-${req.file.originalname}`, req.file.buffer, {
      access: 'public',
    });

    res.json({ url: blob.url });
  } catch (err) {
    console.error('[POST /events/upload]', err);
    res.status(500).json({ error: 'Failed to upload file.' });
  }
});

const EVENT_6_SECRET_ANSWER = 'mrgreedy';

eventsRouter.post('/complete', async (req: Request, res: Response): Promise<void> => {
  try {
    const teamId = req.session.teamId!;
    const { eventNumber, answer, answers, submissionBlobUrl } = req.body as {
      eventNumber?: number;
      answer?: string;
      answers?: number[]; // For event 3
      submissionBlobUrl?: string; // For event 1
    };

    if (!eventNumber || typeof eventNumber !== 'number') {
      res.status(400).json({ error: 'eventNumber is required.' });
      return;
    }

    const gameState = await getGameState();

    if (gameState.activeEventNumber !== eventNumber) {
      res.status(400).json({ error: `Event ${eventNumber} is not currently active.` });
      return;
    }

    if (!gameState.eventOpen) {
      res.status(403).json({ error: 'This event is currently closed.' });
      return;
    }

    let extraData: any = {};

    // Event 1: Forgotten Hill Verification
    if (eventNumber === 1) {
      if (!submissionBlobUrl) {
        res.status(400).json({ error: 'Screenshot URL is required.' });
        return;
      }
      extraData.submissionBlobUrl = submissionBlobUrl;
    }

    // Event 3: The Last Broadcast Verification
    let correctnessRatio = 1;
    if (eventNumber === 3) {
      if (!answers || !Array.isArray(answers) || answers.length !== EVENT_3_ANSWERS.length) {
        res.status(400).json({ error: 'Valid answers array is required.' });
        return;
      }
      let correctCount = 0;
      for (let i = 0; i < EVENT_3_ANSWERS.length; i++) {
        if (answers[i] === EVENT_3_ANSWERS[i]) correctCount++;
      }
      extraData.correctCount = correctCount;
      extraData.totalQuestions = EVENT_3_ANSWERS.length;
      correctnessRatio = correctCount / EVENT_3_ANSWERS.length;
    }

    // Event 6: Cipher Verification
    if (eventNumber === 6) {
      if (!answer || typeof answer !== 'string') {
        res.status(400).json({ error: 'An answer is required for Event 6.' });
        return;
      }
      const normalized = answer.trim().toLowerCase();
      if (normalized !== EVENT_6_SECRET_ANSWER) {
        res.json({ correct: false, message: 'Not quite. Look closer.' });
        return;
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const progress = await tx.eventProgress.findUnique({
        where: { teamId_eventNumber: { teamId, eventNumber } },
      });

      if (!progress) {
        throw new Error(`Event ${eventNumber} has not been started yet.`);
      }

      const current = await expireIfPastDeadline(tx, progress);
      if (current.status === 'EXPIRED') {
        return { timedOut: true as const, progress: current };
      }

      const completeRes = await completeEvent(tx, current, extraData);

      // Post-process score for Event 3 ratio, or verificationStatus for Event 1
      if ('completed' in completeRes) {
        let finalScore = completeRes.score;
        let verificationStatus = 'PENDING';

        if (eventNumber === 3) {
          finalScore = finalScore * correctnessRatio;
          // Format to a reasonable decimal precision (e.g., 9.5)
          finalScore = Math.round(finalScore * 10) / 10;
        }

        const updateData: any = {};
        if (eventNumber === 1) updateData.verificationStatus = 'PENDING';
        if (eventNumber === 3) updateData.score = finalScore;

        if (Object.keys(updateData).length > 0) {
          const updated = await tx.eventProgress.update({
            where: { id: progress.id },
            data: updateData
          });
          completeRes.progress = updated;
          completeRes.score = updated.score;
        }
      }

      return completeRes;
    });

    if ('timedOut' in result || 'expired' in result) {
      res.status(400).json({ success: false, timedOut: true, error: 'Time has expired for this event.' });
      return;
    }

    res.json({
      correct: true,
      success: true,
      ...result,
    });
  } catch (err: any) {
    console.error('[POST /events/complete]', err);
    res.status(400).json({ error: err.message || 'Failed to complete event.' });
  }
});
