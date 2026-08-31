import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { eventsRouter } from './routes/events.js';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS — allow Vite dev server in development only
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());

// Session configuration
// NOTE: MemoryStore is fine for single-process dev/event use.
// For multi-instance production, replace with connect-pg-simple backed by Neon.
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'prodinno-dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      sameSite: 'lax',
    },
  })
);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);

app.listen(PORT, () => {
  console.log(`🚀  API Server running on http://localhost:${PORT}`);
  console.log(`     Active event controlled via Neon SQL: GameState.activeEventNumber / eventOpen`);
});
