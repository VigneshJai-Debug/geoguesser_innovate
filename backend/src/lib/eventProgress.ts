import { Prisma } from '@prisma/client';
import { computeDeadline, hasDeadlinePassed } from './timer.js';
import { calculatePlacementScore } from './scoring.js';

// Use the Prisma transaction client type
type TxClient = Prisma.TransactionClient;

// Inline status type matching the Prisma enum
type EventStatus = 'ACTIVE' | 'COMPLETED' | 'EXPIRED';

// ---------------------------------------------------------------------------
// getOrCreateEventProgress
// Idempotent: safe to call on every page load.
// Creates a fresh EventProgress row only on first entry.
// ---------------------------------------------------------------------------

export async function getOrCreateEventProgress(
  tx: TxClient,
  teamId: string,
  eventNumber: number,
  extras?: { assignedQuestionId?: number }
) {
  const existing = await tx.eventProgress.findUnique({
    where: { teamId_eventNumber: { teamId, eventNumber } },
  });

  if (existing) return existing;

  const startedAt = new Date();
  const deadlineAt = computeDeadline(startedAt);

  return tx.eventProgress.create({
    data: {
      teamId,
      eventNumber,
      status: 'ACTIVE',
      startedAt,
      deadlineAt,
      assignedQuestionId: extras?.assignedQuestionId ?? null,
    },
  });
}

// ---------------------------------------------------------------------------
// expireIfPastDeadline
// Checks server time against the stored deadlineAt.
// If expired, marks the progress as EXPIRED with score 0.
// Returns the (possibly updated) progress record.
// ---------------------------------------------------------------------------

export async function expireIfPastDeadline(
  tx: TxClient,
  progress: { id: string; status: EventStatus; deadlineAt: Date }
) {
  if (progress.status !== 'ACTIVE') return progress;
  if (!hasDeadlinePassed(progress.deadlineAt)) return progress;

  return tx.eventProgress.update({
    where: { id: progress.id },
    data: {
      status: 'EXPIRED',
      score: 0,
      completionNumber: null,
      completedAt: new Date(),
    },
  });
}

// ---------------------------------------------------------------------------
// completeEvent
// Concurrency-safe: counts existing COMPLETED rows inside the transaction
// to assign a unique, monotonically increasing completionNumber.
// Applies placement-based scoring automatically.
// ---------------------------------------------------------------------------

export async function completeEvent(
  tx: TxClient,
  progress: { id: string; status: EventStatus; deadlineAt: Date; eventNumber: number },
  extraData?: {
    correctCount?: number;
    totalQuestions?: number;
    submissionText?: string;
    submissionBlobUrl?: string;
  }
) {
  // Guard: already completed
  if (progress.status === 'COMPLETED') {
    return { alreadyCompleted: true as const };
  }

  // Guard: expired
  if (progress.status === 'EXPIRED') {
    return { expired: true as const };
  }

  // Guard: deadline check inside transaction
  if (hasDeadlinePassed(progress.deadlineAt)) {
    const expired = await tx.eventProgress.update({
      where: { id: progress.id },
      data: {
        status: 'EXPIRED',
        score: 0,
        completionNumber: null,
        completedAt: new Date(),
      },
    });
    return { expired: true as const, progress: expired };
  }

  // Count how many teams have already COMPLETED this event
  const completedCount = await tx.eventProgress.count({
    where: {
      eventNumber: progress.eventNumber,
      status: 'COMPLETED',
    },
  });

  const completionNumber = completedCount + 1;
  const score = calculatePlacementScore(completionNumber);
  const now = new Date();

  const completed = await tx.eventProgress.update({
    where: { id: progress.id },
    data: {
      status: 'COMPLETED',
      completionNumber,
      score,
      completedAt: now,
      submittedAt: now,
      ...(extraData?.correctCount !== undefined && { correctCount: extraData.correctCount }),
      ...(extraData?.totalQuestions !== undefined && { totalQuestions: extraData.totalQuestions }),
      ...(extraData?.submissionText !== undefined && { submissionText: extraData.submissionText }),
      ...(extraData?.submissionBlobUrl !== undefined && { submissionBlobUrl: extraData.submissionBlobUrl }),
    },
  });

  return { completed: true as const, completionNumber, score, progress: completed };
}
