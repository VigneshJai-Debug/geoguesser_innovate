import { Router, Request, Response } from 'express';
import multer from 'multer';
import { put } from '@vercel/blob';
import { Prisma } from '@prisma/client';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import {
  EVENT_2_TOTAL_QUESTIONS,
  EVENT_3_ANSWERS,
  EVENT_5_STAGE_ANSWERS,
  EVENT_7_SECRET_ANSWER,
} from '../constants/game.js';
import { timeRemainingMs } from '../lib/timer.js';
import {
  getOrCreateEventProgress,
  completeEvent,
} from '../lib/eventProgress.js';
import { calculatePlacementScore } from '../lib/scoring.js';

const upload = multer({
  storage: multer.memoryStorage(),
});

export const eventsRouter = Router();

eventsRouter.use(requireAuth);

async function getGameState() {
  let gs = await prisma.gameState.findUnique({
    where: { id: 1 },
  });

  if (!gs) {
    gs = await prisma.gameState.create({
      data: {
        id: 1,
        activeEventNumber: 1,
        eventOpen: true,
      },
    });
  }

  return gs;
}

// ============================================================
// GET EVENT / GAME STATE
// ============================================================

eventsRouter.get(
  '/state',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const teamId = req.session.teamId!;
      const gameState = await getGameState();

      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: { set: true },
      });

      const progresses = await prisma.eventProgress.findMany({
        where: { teamId },
        orderBy: { eventNumber: 'asc' },
      });

      const now = Date.now();

      const progressWithTimer = progresses.map(
        (ep: typeof progresses[number]) => ({
          ...ep,
          timeRemainingMs:
            ep.status === 'ACTIVE'
              ? Math.max(0, ep.deadlineAt.getTime() - now)
              : 0,
        })
      );

      const totalScore = progresses.reduce(
        (sum: number, ep: typeof progresses[number]) =>
          sum + (ep.score ?? 0),
        0
      );

      res.json({
        activeEventNumber: gameState.activeEventNumber,
        eventOpen: gameState.eventOpen,
        eventProgress: progressWithTimer,
        totalScore,

        teamInfo: team
          ? {
              id: team.id,
              teamName: team.teamName,
              setId: team.setId,
              setName: team.set?.name ?? null,
              isSetLead: Boolean(
                team.set && team.set.leadTeamId === team.id
              ),
            }
          : null,
      });
    } catch (err) {
      console.error('[GET /events/state]', err);

      res.status(500).json({
        error: 'Failed to load game state.',
      });
    }
  }
);

// ============================================================
// ENTER ACTIVE EVENT
// ============================================================

eventsRouter.post(
  '/enter',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const teamId = req.session.teamId!;
      const gameState = await getGameState();

      if (!gameState.eventOpen) {
        res.status(403).json({
          error: 'This event is currently closed.',
        });
        return;
      }

      const eventNumber = gameState.activeEventNumber;

      const existing = await prisma.eventProgress.findUnique({
        where: {
          teamId_eventNumber: {
            teamId,
            eventNumber,
          },
        },
      });

      let assignedQuestionId: number | undefined;

      if (!existing && eventNumber === 2) {
        assignedQuestionId =
          Math.floor(Math.random() * EVENT_2_TOTAL_QUESTIONS) + 1;
      }

      const progress = await getOrCreateEventProgress(
        prisma,
        teamId,
        eventNumber,
        {
          assignedQuestionId,
        }
      );

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

      res.status(500).json({
        error: 'Failed to enter event.',
      });
    }
  }
);

// ============================================================
// EVENT 1 FILE UPLOAD
// ============================================================

eventsRouter.post(
  '/upload',
  upload.single('screenshot'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          error: 'No file uploaded.',
        });
        return;
      }

      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.warn(
          '[POST /events/upload] No BLOB_READ_WRITE_TOKEN found.'
        );

        res.status(500).json({
          error:
            'File storage is not configured on the server.',
        });

        return;
      }

      const safeFileName = req.file.originalname.replace(
        /[^a-zA-Z0-9._-]/g,
        '_'
      );

      const blob = await put(
        `event1/${req.session.teamId}-${Date.now()}-${safeFileName}`,
        req.file.buffer,
        {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
        }
      );

      res.json({
        url: blob.url,
      });
    } catch (err: any) {
      console.error(
        '[POST /events/upload] FULL ERROR:',
        err
      );

      res.status(500).json({
        error: 'Failed to upload file.',
        details: err?.message || String(err),
      });
    }
  }
);

// ============================================================
// EVENT 6 SECRET
// ============================================================

const EVENT_6_SECRET_ANSWER = 'mrgreedy';

// ============================================================
// COMPLETE EVENT
// ============================================================

eventsRouter.post(
  '/complete',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const teamId = req.session.teamId!;

      const {
        eventNumber,
        stage,
        answer,
        answers,
        submissionBlobUrl,
      } = req.body as {
        eventNumber?: number;
        stage?: number;
        answer?: string;
        answers?: number[];
        submissionBlobUrl?: string;
      };

      if (!eventNumber || typeof eventNumber !== 'number') {
        res.status(400).json({
          error: 'eventNumber is required.',
        });
        return;
      }

      const gameState = await getGameState();

      if (gameState.activeEventNumber !== eventNumber) {
        res.status(400).json({
          error: `Event ${eventNumber} is not currently active.`,
        });
        return;
      }

      if (!gameState.eventOpen) {
        res.status(403).json({
          error: 'This event is currently closed.',
        });
        return;
      }

      // ========================================================
      // EVENT 5 — THREE LOCKS
      // ========================================================

      if (eventNumber === 5) {
        if (
          !stage ||
          typeof stage !== 'number' ||
          stage < 1 ||
          stage > 3
        ) {
          res.status(400).json({
            error:
              'Valid stage number (1, 2, or 3) is required for Event 5.',
          });
          return;
        }

        if (!answer || typeof answer !== 'string') {
          res.status(400).json({
            error: 'An answer is required.',
          });
          return;
        }

        const progress =
          await prisma.eventProgress.findUnique({
            where: {
              teamId_eventNumber: {
                teamId,
                eventNumber: 5,
              },
            },
          });

        if (!progress) {
          res.status(400).json({
            error: 'Event 5 has not been started yet.',
          });
          return;
        }

        if (
          progress.status === 'EXPIRED' ||
          progress.deadlineAt.getTime() <= Date.now()
        ) {
          await prisma.eventProgress.update({
            where: {
              id: progress.id,
            },
            data: {
              status: 'EXPIRED',
              score: 0,
              completedAt: new Date(),
            },
          });

          res.status(400).json({
            success: false,
            timedOut: true,
            error: 'Time has expired for this event.',
          });

          return;
        }

        if (progress.status === 'COMPLETED') {
          res.json({
            correct: true,
            completed: true,
            alreadyCompleted: true,
          });

          return;
        }

        const currentUnlockedStage =
          (progress.correctCount ?? 0) + 1;

        if (stage > currentUnlockedStage) {
          res.status(400).json({
            error: `You must solve Stage ${currentUnlockedStage} first.`,
          });

          return;
        }

        const expectedAnswer =
          EVENT_5_STAGE_ANSWERS[
            stage as 1 | 2 | 3
          ];

        const normalizedAnswer =
          answer.trim().toLowerCase();

        if (normalizedAnswer !== expectedAnswer) {
          res.json({
            correct: false,
            message: 'Not quite. Look again.',
          });

          return;
        }

        if (stage < 3) {
          const updated =
            await prisma.eventProgress.update({
              where: {
                id: progress.id,
              },
              data: {
                correctCount: Math.max(
                  progress.correctCount ?? 0,
                  stage
                ),
              },
            });

          res.json({
            correct: true,
            stageCompleted: stage,
            nextStage: stage + 1,
            correctCount: updated.correctCount,
            message: `Stage ${stage} unlocked!`,
          });

          return;
        }

        const result =
          await prisma.$transaction(
            async (
              tx: Prisma.TransactionClient
            ) => {
              const fresh =
                await tx.eventProgress.findUniqueOrThrow({
                  where: {
                    id: progress.id,
                  },
                });

              if (fresh.status === 'EXPIRED') {
                return {
                  timedOut: true as const,
                  progress: fresh,
                };
              }

              return await completeEvent(
                tx,
                fresh,
                {
                  correctCount: 3,
                  totalQuestions: 3,
                }
              );
            }
          );

        if (
          'timedOut' in result ||
          'expired' in result
        ) {
          res.status(400).json({
            success: false,
            timedOut: true,
            error: 'Time has expired for this event.',
          });

          return;
        }

        res.json({
          correct: true,
          success: true,
          stageCompleted: 3,
          ...result,
        });

        return;
      }

      // ========================================================
      // EVENT 7 — SET CHALLENGE
      // ========================================================

      if (eventNumber === 7) {
        if (!answer || typeof answer !== 'string') {
          res.status(400).json({
            error:
              'An answer is required for Event 7.',
          });

          return;
        }

        const team =
          await prisma.team.findUnique({
            where: {
              id: teamId,
            },
            include: {
              set: true,
            },
          });

        if (!team || !team.setId || !team.set) {
          res.status(400).json({
            error:
              'Your team is not assigned to a TeamSet.',
          });

          return;
        }

        if (team.set.leadTeamId !== team.id) {
          res.status(403).json({
            error:
              'Only the designated Set Lead can submit the final answer for this set.',
          });

          return;
        }

        const normalizedAnswer =
          answer.trim().toLowerCase();

        if (
          normalizedAnswer !==
          EVENT_7_SECRET_ANSWER
        ) {
          res.json({
            correct: false,
            message: 'Not quite. Try again.',
          });

          return;
        }

        const result =
          await prisma.$transaction(
            async (
              tx: Prisma.TransactionClient
            ) => {
              const leadProgress =
                await tx.eventProgress.findUnique({
                  where: {
                    teamId_eventNumber: {
                      teamId,
                      eventNumber: 7,
                    },
                  },
                });

              if (!leadProgress) {
                throw new Error(
                  'Event 7 has not been started yet.'
                );
              }

              if (
                leadProgress.status === 'EXPIRED' ||
                leadProgress.deadlineAt.getTime() <=
                  Date.now()
              ) {
                await tx.eventProgress.update({
                  where: {
                    id: leadProgress.id,
                  },
                  data: {
                    status: 'EXPIRED',
                    score: 0,
                    completedAt: new Date(),
                  },
                });

                return {
                  timedOut: true as const,
                };
              }

              const completedList =
                await tx.eventProgress.findMany({
                  where: {
                    eventNumber: 7,
                    status: 'COMPLETED',
                  },
                  include: {
                    team: true,
                  },
                });

              const completedSetIds =
                new Set(
                  completedList
                    .map(
                      (p) => p.team.setId
                    )
                    .filter(Boolean)
                );

              const setCompletionNumber =
                completedSetIds.size + 1;

              const score =
                calculatePlacementScore(
                  setCompletionNumber
                );

              const now = new Date();

              const setTeams =
                await tx.team.findMany({
                  where: {
                    setId: team.setId!,
                  },
                });

              for (const setTeam of setTeams) {
                const ep =
                  await tx.eventProgress.findUnique({
                    where: {
                      teamId_eventNumber: {
                        teamId: setTeam.id,
                        eventNumber: 7,
                      },
                    },
                  });

                if (ep) {
                  await tx.eventProgress.update({
                    where: {
                      id: ep.id,
                    },
                    data: {
                      status: 'COMPLETED',
                      score,
                      completionNumber:
                        setCompletionNumber,
                      completedAt: now,
                      submittedAt: now,
                    },
                  });
                } else {
                  await tx.eventProgress.create({
                    data: {
                      teamId: setTeam.id,
                      eventNumber: 7,
                      status: 'COMPLETED',
                      score,
                      completionNumber:
                        setCompletionNumber,
                      startedAt:
                        leadProgress.startedAt,
                      deadlineAt:
                        leadProgress.deadlineAt,
                      completedAt: now,
                      submittedAt: now,
                    },
                  });
                }
              }

              return {
                completed: true as const,
                completionNumber:
                  setCompletionNumber,
                score,
              };
            }
          );

        if ('timedOut' in result) {
          res.status(400).json({
            success: false,
            timedOut: true,
            error: 'Time has expired for this event.',
          });

          return;
        }

        res.json({
          correct: true,
          success: true,
          ...result,
        });

        return;
      }

      // ========================================================
      // EVENTS 1 / 3 / 6 / GENERAL COMPLETION
      // ========================================================

      const extraData: Record<string, any> = {};

      // Event 1
      if (eventNumber === 1) {
        if (!submissionBlobUrl) {
          res.status(400).json({
            error: 'Screenshot URL is required.',
          });

          return;
        }

        extraData.submissionBlobUrl =
          submissionBlobUrl;
      }

      // Event 3
      let correctnessRatio = 1;

      if (eventNumber === 3) {
        if (
          !answers ||
          !Array.isArray(answers) ||
          answers.length !==
            EVENT_3_ANSWERS.length
        ) {
          res.status(400).json({
            error:
              'Valid answers array is required.',
          });

          return;
        }

        let correctCount = 0;

        for (
          let i = 0;
          i < EVENT_3_ANSWERS.length;
          i++
        ) {
          if (
            answers[i] ===
            EVENT_3_ANSWERS[i]
          ) {
            correctCount++;
          }
        }

        extraData.correctCount = correctCount;
        extraData.totalQuestions =
          EVENT_3_ANSWERS.length;

        correctnessRatio =
          correctCount /
          EVENT_3_ANSWERS.length;
      }

      // Event 6
      if (eventNumber === 6) {
        if (!answer || typeof answer !== 'string') {
          res.status(400).json({
            error:
              'An answer is required for Event 6.',
          });

          return;
        }

        const normalized =
          answer.trim().toLowerCase();

        if (
          normalized !==
          EVENT_6_SECRET_ANSWER
        ) {
          res.json({
            correct: false,
            message:
              'Not quite. Look closer.',
          });

          return;
        }
      }

      const result =
        await prisma.$transaction(
          async (
            tx: Prisma.TransactionClient
          ) => {
            const progress =
              await tx.eventProgress.findUnique({
                where: {
                  teamId_eventNumber: {
                    teamId,
                    eventNumber,
                  },
                },
              });

            if (!progress) {
              throw new Error(
                `Event ${eventNumber} has not been started yet.`
              );
            }

            const freshProgress =
              await tx.eventProgress.findUnique({
                where: {
                  id: progress.id,
                },
              });

            if (!freshProgress) {
              throw new Error(
                'Progress record not found.'
              );
            }

            if (
              freshProgress.status ===
              'EXPIRED'
            ) {
              return {
                timedOut: true as const,
                progress: freshProgress,
              };
            }

            const completeRes =
              await completeEvent(
                tx,
                freshProgress,
                extraData
              );

            if ('completed' in completeRes) {
              let finalScore: number =
                completeRes.score ?? 0;

              if (eventNumber === 3) {
                finalScore =
                  finalScore *
                  correctnessRatio;

                finalScore =
                  Math.round(
                    finalScore * 10
                  ) / 10;
              }

              const updateData: Record<
                string,
                unknown
              > = {};

              if (eventNumber === 1) {
                updateData.verificationStatus =
                  'PENDING';
              }

              if (eventNumber === 3) {
                updateData.score =
                  finalScore;
              }

              if (
                Object.keys(updateData).length >
                0
              ) {
                const updated =
                  await tx.eventProgress.update({
                    where: {
                      id: progress.id,
                    },
                    data: updateData,
                  });

                (completeRes as any).progress =
                  updated;

                (completeRes as any).score =
                  updated.score;
              }
            }

            return completeRes;
          }
        );

      if (
        'timedOut' in result ||
        'expired' in result
      ) {
        res.status(400).json({
          success: false,
          timedOut: true,
          error: 'Time has expired for this event.',
        });

        return;
      }

      res.json({
        correct: true,
        success: true,
        ...result,
      });
    } catch (err: any) {
      console.error(
        '[POST /events/complete]',
        err
      );

      res.status(400).json({
        error:
          err.message ||
          'Failed to complete event.',
      });
    }
  }
);