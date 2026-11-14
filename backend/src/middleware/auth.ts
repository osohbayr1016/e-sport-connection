import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import User, { UserRole } from "../models/User";

export interface JWTPayload {
  id: string;
  email: string;
  role: string;
  ver?: number;
}

export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    _id: string;
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatar?: string;
    isVerified: boolean;
    isOnline?: boolean;
    tokenVersion?: number;
  };
}

export const authenticateToken = async (
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    const authHeader = request.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      reply.status(401).send({
        success: false,
        message: "Authentication token required",
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    // Get user from database
    const user = await User.findById(decoded.id)
      .select("_id email name avatar role isVerified isOnline +tokenVersion")
      .lean();

    if (!user) {
      reply.status(401).send({
        success: false,
        message: "Invalid token - user not found",
      });
      return;
    }

    if ((decoded.ver ?? 0) !== (user.tokenVersion ?? 0)) {
      reply.status(401).send({ success: false, message: "Session revoked, sign in again" });
      return;
    }
    request.user = {
      _id: user._id.toString(),
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      avatar: user.avatar,
      isVerified: user.isVerified,
      isOnline: user.isOnline,
      tokenVersion: user.tokenVersion ?? 0,
    };
  } catch (error) {
    reply.status(403).send({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export const requireRole = (roles: string[]) => {
  return async (
    request: AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> => {
    if (!request.user) {
      reply.status(401).send({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!roles.includes(request.user.role)) {
      reply.status(403).send({
        success: false,
        message: `Access denied. Required roles: ${roles.join(", ")}`,
      });
      return;
    }
  };
};

// Specific role middlewares
export const requirePlayer = requireRole(["PLAYER"]);
export const requireOrganization = requireRole(["ORGANIZATION"]);
export const requireAdmin = requireRole(["ADMIN"]);
export const requireCoach = requireRole(["COACH"]);
