// Time constants in milliseconds
export const TIME = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
}

// Token durations
export const TOKEN_DURATION = {
  ACCESS_TOKEN: 2 * TIME.HOUR, // 2 hours
  REFRESH_TOKEN: 30 * TIME.DAY, // 30 days
  SESSION: 30 * TIME.DAY, // 30 days
}

// Cookie settings
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
}

// Session cleanup periods
export const CLEANUP = {
  EXPIRED_SESSIONS: 24 * TIME.HOUR, // Clean up expired sessions every 24 hours
}
