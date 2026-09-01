import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import cors from 'cors';

import { authRouter } from './routes/auth.js';
import { eventsRouter } from './routes/events.js';
import { adminRouter } from './routes/admin.js';

const app = express();

const PORT = Number(process.env.PORT) || 3001;

// Trust Render's reverse proxy.
// Required so secure session cookies work correctly in production.
app.set('trust proxy', 1);

// CORS
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));

// Session configuration
app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      'prodinno-dev-secret-change-in-production',

    resave: false,
    saveUninitialized: false,

    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite:
        process.env.NODE_ENV === 'production'
          ? 'none'
          : 'lax',
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/admin', adminRouter);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API Server running on port ${PORT}`);
});