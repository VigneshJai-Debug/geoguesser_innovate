import 'express-session';

declare module 'express-session' {
  interface SessionData {
    teamId: string;
    teamName: string;
  }
}
