# GeoQuest — Innovate To Escape

A team-based escape room game with soft UI (neumorphic design), secure session-based authentication, Prisma ORM with Neon PostgreSQL, persistent question assignment, server-side timer validation, and concurrency-safe completion-order scoring.

---

## 🚀 Quick Start Guide

### Step 1: Add Your Database URL to `.env`
Open `.env` in the root directory and paste your Neon PostgreSQL connection string:

```env
DATABASE_URL="postgresql://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
PORT=3001
SESSION_SECRET="your-secure-random-secret-key"
```

> **Note:** `.env` is already added to `.gitignore` to keep credentials safe.

---

### Step 2: Generate Prisma Client & Push Schema
Run the following commands to create the database tables (`Team`, `RoundProgress`, `GameState`) on Neon:

```bash
# Generate the Prisma client
npm run db:generate

# Push schema directly to Neon DB (recommended for rapid setup)
npm run db:push

# Or run Prisma migrations:
# npm run db:migrate
```

---

### Step 3: Seed Development Teams & Initial Game State
Run the idempotent seed script to populate the development teams and initialize `GameState` (`id = 1, activeRound = 1`):

```bash
npm run seed
```

This seeds 4 development teams with securely hashed passwords:

| Team Name | Password |
|---|---|
| **Team Alpha** | `alpha_1234` |
| **Team Beta** | `beta_5678` |
| **Team Gamma** | `gamma_2468` |
| **Team Delta** | `delta_1357` |

*(To add more teams later, simply edit `prisma/seed.ts` and run `npm run seed` again — it is idempotent and uses `teamName` as the unique key).*

---

### Step 4: Start the Application
Run both the Vite frontend and Express API server concurrently:

```bash
npm run dev:all
```

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **API Server:** [http://localhost:3001](http://localhost:3001)

---

## 🎮 Game Architecture & Administrator Controls

### Global Round Control via Neon SQL Editor
The globally active round is controlled directly by the `GameState` table in your database (`id = 1`):

- **Start Round 1 (Geography Challenge):**
  ```sql
  UPDATE "GameState" SET "activeRound" = 1, "updatedAt" = NOW() WHERE id = 1;
  ```

- **Start Round 2 (Cipher Challenge):**
  ```sql
  UPDATE "GameState" SET "activeRound" = 2, "updatedAt" = NOW() WHERE id = 1;
  ```

When you change `activeRound` to `2`:
- Any team that did not finish Round 1 receives 0 points (`TIMED_OUT`) and can no longer submit Round 1 answers.
- When teams refresh or navigate, they immediately access Round 2.

---

## ⏱️ Round Rules, Timers & Scoring

1. **30-Minute Team Timer:**
   - Starts when a team first enters a round (`startedAt` stored in database).
   - Refreshing or reopening the browser does **not** reset or extend the timer.
   - If 30 minutes expire before completion, the round status becomes `TIMED_OUT` (0 points).

2. **Persistent Round 1 Question Assignment:**
   - When a team enters Round 1, the server randomly assigns one of the 5 geography questions.
   - The question ID is saved to `assignedQuestionId` in `RoundProgress`.
   - Refreshing or logging out always restores the exact same question.

3. **Concurrency-Safe Completion Ranking:**
   - 1st team to complete = 20 points
   - 2nd team = 19 points
   - ...
   - 20th team = 1 point
   - 21st+ = 0 points
   - Timed out = 0 points
   - Formula: `max(21 - completionNumber, 0)`

4. **Round 2 (Cipher Challenge):**
   - Correct answer: `mrgreedy` (validated securely on the server; case-insensitive and trimmed).
   - The answer is never bundled into frontend source code.

5. **Final Completion:**
   - After Round 2 ends, the Final Screen displays Round 1 Score, Round 2 Score, Total Score, and:
     `Results will be published soon.`

---

## 📁 Key File Locations

- `src/game/scoring.ts` — Central scoring configuration file.
- `src/data/questions.ts` — Static Geography questions and clues (Round 1).
- `src/data/cipher.txt` — Static Cipher challenge text (Round 2).
- `server/constants/game.ts` — Server-authoritative rules, time limits, and secret answers.
- `prisma/schema.prisma` — PostgreSQL database models (`Team`, `RoundProgress`, `GameState`).
- `prisma/seed.ts` — Seed script for teams and game state.
