import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { AuthenticatedRequest } from "../middleware/auth";

interface LoginRequest {
  Body: {
    email: string;
    password: string;
  };
}

interface RegisterRequest {
  Body: {
    name: string;
    email: string;
    password: string;
    role: string;
  };
}

// Generate JWT token
const generateToken = (userId: string, email: string, role: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }

  const payload = { id: userId, email, role };

  return jwt.sign(payload, secret, { expiresIn: "7d" });
};

// User login
export const login = async (
  request: FastifyRequest<LoginRequest>,
  reply: FastifyReply
) => {
  try {
    const { email, password } = request.body;

    // Validate input
    if (!email || !password) {
      return reply.status(400).send({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user by email
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return reply.status(401).send({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return reply.status(401).send({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate token
    const token = generateToken(user._id.toString(), user.email, user.role);

    // Update last seen
    user.lastSeen = new Date();
    user.isOnline = true;
    await user.save();

    // Return user data (without password) and token
    const userResponse = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      isVerified: user.isVerified,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    };

    reply.send({
      success: true,
      message: "Login successful",
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    reply.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
};

// User registration
export const register = async (
  request: FastifyRequest<RegisterRequest>,
  reply: FastifyReply
) => {
  try {
    const { name, email, password, role } = request.body;

    // Validate input
    if (!name || !email || !password || !role) {
      return reply.status(400).send({
        success: false,
        message: "Name, email, password, and role are required",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return reply.status(409).send({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Validate role
    // Public registration may NEVER mint an administrator account.
    const validRoles = ["PLAYER", "COACH", "ORGANIZATION"];
    if (!validRoles.includes(role)) {
      return reply.status(400).send({
        success: false,
        message:
          "Invalid role. Must be one of: PLAYER, COACH, ORGANIZATION",
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role,
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id.toString(), user.email, user.role);

    // Return user data (without password) and token
    const userResponse = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      isVerified: user.isVerified,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    };

    reply.status(201).send({
      success: true,
      message: "Registration successful",
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    reply.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get current user profile
export const getCurrentUser = async (
  request: AuthenticatedRequest,
  reply: FastifyReply
) => {
  try {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        message: "Authentication required",
      });
    }

    reply.send({
      success: true,
      data: {
        user: request.user,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    reply.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
};

// User logout
export const logout = async (
  request: AuthenticatedRequest,
  reply: FastifyReply
) => {
  try {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        message: "Authentication required",
      });
    }

    // Update user status
    await User.findByIdAndUpdate(request.user.id, {
      isOnline: false,
      lastSeen: new Date(),
    });

    reply.send({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    reply.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
};

// Refresh token
export const refreshToken = async (
  request: AuthenticatedRequest,
  reply: FastifyReply
) => {
  try {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        message: "Authentication required",
      });
    }

    // Generate new token
    const token = generateToken(
      request.user.id,
      request.user.email,
      request.user.role
    );

    // Update last seen
    await User.findByIdAndUpdate(request.user.id, {
      lastSeen: new Date(),
    });

    reply.send({
      success: true,
      message: "Token refreshed successfully",
      user: request.user,
      token,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    reply.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
};
