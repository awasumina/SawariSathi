import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "sawari_sathi_secret_2025";

// ============================================
// JWT Authentication Middleware
// ============================================
export const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Extract token (format: "Bearer TOKEN")
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Invalid token format.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    // Continue to next middleware/route
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please login again.",
      });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Authentication failed.",
      });
    }

    console.error("Auth middleware error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal authentication error",
    });
  }
};

// ============================================
// Optional Auth Middleware (doesn't fail if no token)
// ============================================
export const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
        };
      }
    }

    // Continue regardless of token presence
    next();
  } catch (err) {
    // If token is invalid, just continue without user
    next();
  }
};
