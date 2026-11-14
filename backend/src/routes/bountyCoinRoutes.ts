import { requestCoinWithdrawal, decideCoinWithdrawal, markCoinWithdrawalPaid, decideCoinPurchase, handleFinanceError } from "../services/coinTransactionService";
import { FastifyInstance, FastifyPluginAsync } from "fastify";
import mongoose from "mongoose";
import BountyCoin from "../models/BountyCoin";
import Squad from "../models/Squad";
import WithdrawRequest from "../models/WithdrawRequest";
import PurchaseRequest from "../models/PurchaseRequest";
import { getDivisionInfo } from "../utils/divisionSystem";
import { authenticateToken, requireAdmin } from "../middleware/auth";

const bountyCoinRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance
) => {
  // Health check
  fastify.get("/health", async (request, reply) => {
    return reply.send({
      success: true,
      message: "Bounty coin routes available",
      timestamp: new Date().toISOString(),
    });
  });

  // Get user's bounty coin balance
  fastify.get("/balance/:userId", { preHandler: [authenticateToken] }, async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string };
      const actor = (request as any).user;
      if (!actor || (actor.id !== userId && actor.role !== "ADMIN")) {
        return reply.status(403).send({ success: false, message: "Access denied" });
      }
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return reply.status(400).send({ success: false, message: "Invalid user ID" });
      }

      // Check if user has bounty coin data
      let bountyCoinData = await BountyCoin.findOne({ userId }).lean();

      if (!bountyCoinData) {
        // A GET must not create financial ledger records. Return the existing
        // squad-derived summary without mutating the database.
        const squad = await Squad.findOne({
          $or: [{ leader: userId }, { members: userId }],
        })
          .select("currentBountyCoins totalBountyCoinsEarned totalBountyCoinsSpent division")
          .lean();

        return reply.send({
          success: true,
          data: {
            userId,
            squadId: squad?._id,
            balance: squad?.currentBountyCoins || 0,
            totalEarned: squad?.totalBountyCoinsEarned || 0,
            totalSpent: squad?.totalBountyCoinsSpent || 0,
            transactions: [],
          },
        });
      }

      return reply.send({
        success: true,
        data: bountyCoinData,
      });
    } catch (error) {
      console.error("Error fetching bounty coin balance:", error);
      return reply.status(500).send({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Get user's bounty coin transactions
  fastify.get("/transactions/:userId", { preHandler: [authenticateToken] }, async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string };
      const actor = (request as any).user;
      if (!actor || (actor.id !== userId && actor.role !== "ADMIN")) {
        return reply.status(403).send({ success: false, message: "Access denied" });
      }
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return reply.status(400).send({ success: false, message: "Invalid user ID" });
      }

      const bountyCoinData = await BountyCoin.findOne({ userId }).lean();

      if (!bountyCoinData) {
        return reply.status(404).send({
          success: false,
          message: "Bounty coin data not found",
        });
      }

      return reply.send({
        success: true,
        data: bountyCoinData.transactions || [],
      });
    } catch (error) {
      console.error("Error fetching bounty coin transactions:", error);
      return reply.status(500).send({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Get squad's bounty coin summary
  fastify.get("/squad/:squadId", async (request, reply) => {
    try {
      const { squadId } = request.params as { squadId: string };

      const squad = await Squad.findById(squadId)
        .select(
          "name tag currentBountyCoins totalBountyCoinsEarned totalBountyCoinsSpent division"
        )
        .lean();

      if (!squad) {
        return reply.status(404).send({
          success: false,
          message: "Squad not found",
        });
      }

      return reply.send({
        success: true,
        data: {
          squadId: squad._id,
          squadName: squad.name,
          squadTag: squad.tag,
          currentBountyCoins: squad.currentBountyCoins || 0,
          totalEarned: squad.totalBountyCoinsEarned || 0,
          totalSpent: squad.totalBountyCoinsSpent || 0,
          division: squad.division || "SILVER",
        },
      });
    } catch (error) {
      console.error("Error fetching squad bounty coin summary:", error);
      return reply.status(500).send({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Get bounty coin leaderboard
  fastify.get("/leaderboard", async (request, reply) => {
    try {
      const { limit = "10" } = request.query as { limit?: string };

      const leaderboard = await Squad.find({})
        .select("name tag currentBountyCoins totalBountyCoinsEarned division")
        .sort({ currentBountyCoins: -1, totalBountyCoinsEarned: -1 })
        .limit(parseInt(limit) || 10)
        .lean();

      return reply.send({
        success: true,
        data: leaderboard.map((squad) => ({
          squadId: squad._id,
          squadName: squad.name,
          squadTag: squad.tag,
          currentBountyCoins: squad.currentBountyCoins || 0,
          totalEarned: squad.totalBountyCoinsEarned || 0,
          division: squad.division || "SILVER",
        })),
      });
    } catch (error) {
      console.error("Error fetching bounty coin leaderboard:", error);
      return reply.status(500).send({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Add transaction to user's bounty coin history
  fastify.post("/transaction", { preHandler: [authenticateToken, requireAdmin] }, async (request, reply) => {
    try {
      const { userId, type, amount, description } = request.body as {
        userId: string;
        type: "earn" | "spend" | "purchase" | "withdraw";
        amount: number;
        description: string;
      };

      if (!mongoose.Types.ObjectId.isValid(userId) ||
          !["earn", "spend", "purchase", "withdraw"].includes(type) ||
          !Number.isFinite(amount) || amount <= 0 || amount > 100000000) {
        return reply.status(400).send({ success: false, message: "Invalid transaction" });
      }
      let bountyCoinData = await BountyCoin.findOne({ userId });

      if (!bountyCoinData) {
        // Create new bounty coin data if it doesn't exist
        bountyCoinData = new BountyCoin({
          userId,
          balance: 0,
          totalEarned: 0,
          totalSpent: 0,
          transactions: [],
        });
      }

      // Add transaction
      const transaction = {
        type,
        amount,
        description,
        timestamp: new Date(),
      };

      bountyCoinData.transactions.push(transaction);

      // Update balance and totals
      if (type === "earn" || type === "purchase") {
        bountyCoinData.balance += amount;
        bountyCoinData.totalEarned += amount;
      } else if (type === "spend" || type === "withdraw") {
        bountyCoinData.balance = Math.max(0, bountyCoinData.balance - amount);
        bountyCoinData.totalSpent += amount;
      }

      await bountyCoinData.save();

      return reply.send({
        success: true,
        data: {
          newBalance: bountyCoinData.balance,
          transaction,
        },
      });
    } catch (error) {
      console.error("Error adding bounty coin transaction:", error);
      return reply.status(500).send({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // All withdrawals are atomic and validate authenticated squad ownership.
  fastify.post("/withdraw", { preHandler: [authenticateToken] }, async (request: any, reply) => {
    try {
      const wr = await requestCoinWithdrawal(request.user?.id, request.body as any);
      return reply.send({ success: true, data: wr });
    } catch (error) { return handleFinanceError(error, reply); }
  });


  // List withdraw requests (admin sees all, leader sees their squad's)
  fastify.get(
    "/withdraw",
    { preHandler: [authenticateToken] },
    async (request: any, reply) => {
      try {
        const user = request.user;
        const { status, squadId } = request.query as any;

        const query: any = {};
        if (status) query.status = status;

        if (user?.role === "ADMIN") {
          if (squadId) query.squadId = squadId;
        } else {
          const squads = await Squad.find({ leader: user.id })
            .select("_id")
            .lean();
          const ids = squads.map((s) => s._id);
          query.squadId = { $in: ids };
        }

        const results = await WithdrawRequest.find(query)
          .populate("squadId", "name tag")
          .populate("requestedBy", "name email")
          .sort({ createdAt: -1 })
          .lean();

        return reply.send({ success: true, data: results });
      } catch (error) {
        console.error("Error listing withdraw requests:", error);
        return reply
          .status(500)
          .send({ success: false, message: "Internal server error" });
      }
    }
  );

  fastify.post("/withdraw/:id/decision", { preHandler: [authenticateToken, requireAdmin] }, async (request: any, reply) => {
    try {
      const { decision, adminNotes } = request.body as any;
      const wr = await decideCoinWithdrawal(request.user?.id, request.params.id, decision, adminNotes);
      return reply.send({ success: true, data: wr });
    } catch (error) { return handleFinanceError(error, reply); }
  });


  fastify.post("/withdraw/:id/mark-paid", { preHandler: [authenticateToken, requireAdmin] }, async (request: any, reply) => {
    try {
      const wr = await markCoinWithdrawalPaid(request.user?.id, request.params.id);
      return reply.send({ success: true, data: wr, message: "Withdrawal marked paid" });
    } catch (error) { return handleFinanceError(error, reply); }
  });


  // Request bounty coin purchase (squad leader only)
  fastify.post(
    "/request-purchase",
    { preHandler: [authenticateToken] },
    async (request: any, reply) => {
      try {
        const { squadId, amount } = request.body as any;
        const userId = request.user?.id as string;

        if (!squadId || !amount) {
          return reply.status(400).send({
            success: false,
            message: "squadId and amount are required",
          });
        }

        if (amount <= 0) {
          return reply.status(400).send({
            success: false,
            message: "Amount must be greater than 0",
          });
        }

        const squad = await Squad.findById(squadId);
        if (!squad) {
          return reply
            .status(404)
            .send({ success: false, message: "Squad not found" });
        }

        // Only leader can request purchase
        if (!userId || squad.leader.toString() !== userId) {
          return reply.status(403).send({
            success: false,
            message: "Only squad leader can request bounty coin purchase",
          });
        }

        // Create purchase request
        const purchaseRequest = new PurchaseRequest({
          squadId: squad._id,
          requestedBy: userId,
          amount,
          status: "PENDING",
        });

        await purchaseRequest.save();

        return reply.send({
          success: true,
          data: purchaseRequest,
          message:
            "Bounty coin purchase request submitted successfully. Admin will review and process your request.",
        });
      } catch (error) {
        console.error("Error creating purchase request:", error);
        return reply
          .status(500)
          .send({ success: false, message: "Internal server error" });
      }
    }
  );

  // List purchase requests (admin sees all, leader sees their squad's)
  fastify.get(
    "/purchase",
    { preHandler: [authenticateToken] },
    async (request: any, reply) => {
      try {
        const user = request.user;
        const { status, squadId } = request.query as any;

        const query: any = {};
        if (status) query.status = status;

        if (user?.role === "ADMIN") {
          if (squadId) query.squadId = squadId;
        } else {
          const squads = await Squad.find({ leader: user.id })
            .select("_id")
            .lean();
          const ids = squads.map((s) => s._id);
          query.squadId = { $in: ids };
        }

        const results = await PurchaseRequest.find(query)
          .populate("squadId", "name tag")
          .populate("requestedBy", "name email")
          .sort({ createdAt: -1 })
          .lean();

        return reply.send({ success: true, data: results });
      } catch (error) {
        console.error("Error listing purchase requests:", error);
        return reply
          .status(500)
          .send({ success: false, message: "Internal server error" });
      }
    }
  );

  fastify.post("/purchase/:id/decision", { preHandler: [authenticateToken, requireAdmin] }, async (request: any, reply) => {
    try {
      const { decision, adminNotes } = request.body as any;
      const pr = await decideCoinPurchase(request.user?.id, request.params.id, decision, adminNotes);
      return reply.send({ success: true, data: pr });
    } catch (error) { return handleFinanceError(error, reply); }
  });

};

export default bountyCoinRoutes;
