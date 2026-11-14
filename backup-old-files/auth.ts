import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { UserRole } from "../models/User";

export interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
}

// JWT Authentication middleware
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ message: "Нэвтрэх токен шаардлагатай" });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    // Get user from database
    const user = await User.findById(decoded.id)
      .select("_id email name avatar role isVerified isOnline")
      .lean();

    if (!user) {
      res.status(401).json({ message: "Invalid token" });
      return;
    }

    req.user = { ...user, id: user._id.toString() } as any;
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid token" });
  }
};

// Role-based access control middleware
export const requireRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (!roles.includes((req.user as any).role)) {
      res.status(403).json({
        message: `Access denied. Required roles: ${roles.join(", ")}`,
      });
      return;
    }

    next();
  };
};

// Specific role middlewares
export const requirePlayer = requireRole([UserRole.PLAYER]);
export const requireOrganization = requireRole([UserRole.ORGANIZATION]);
export const requireAdmin = requireRole([UserRole.ADMIN]);

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

      const user = await User.findById(decoded.id)
        .select("_id email name avatar role isVerified")
        .lean();

      if (user) {
        req.user = { ...user, id: user._id.toString() } as any;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
