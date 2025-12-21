import rateLimit from "express-rate-limit";

// ============================================
// Rate Limiter for Login Attempts
// ============================================
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
});

// ============================================
// Rate Limiter for Signup (DEVELOPMENT - Increased limits for testing)
// ============================================
export const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes (reduced from 1 hour)
  max: 20, // Limit each IP to 20 signup requests (increased from 3 for testing)
  message: {
    success: false,
    message: "Too many accounts created. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================
// General API Rate Limiter
// ============================================
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
