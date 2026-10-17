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
  fastify.get("/balance/:userId", async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string };

      // Check if user has bounty coin data
      let bountyCoinData = await BountyCoin.findOne({ userId }).lean();

      if (!bountyCoinData) {
        // If no bounty coin data exists, create it from squad data
        const squad = await Squad.findOne({
          $or: [{ leader: userId }, { members: userId }],
        })
          .select(
            "currentBountyCoins totalBountyCoinsEarned totalBountyCoinsSpent division"
          )
          .lean();

        if (squad) {
          const newBountyCoin = new BountyCoin({
            userId: userId,
            squadId: squad._id,
            balance: squad.currentBountyCoins || 0,
            totalEarned: squad.totalBountyCoinsEarned || 0,
            totalSpent: squad.totalBountyCoinsSpent || 0,
            transactions: [],
          });
          await newBountyCoin.save();
          bountyCoinData = await BountyCoin.findOne({ userId }).lean();
        } else {
          // Create default bounty coin data for user
          const newBountyCoin = new BountyCoin({
            userId: userId,
            balance: 0,
            totalEarned: 0,
            totalSpent: 0,
            transactions: [],
          });
          await newBountyCoin.save();
          bountyCoinData = await BountyCoin.findOne({ userId }).lean();
        }
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
  fastify.get("/transactions/:userId", async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string };

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

  // Create a withdraw request (squad leader only)
  fastify.post(
    "/withdraw",
    { preHandler: [authenticateToken] },
    async (request: any, reply) => {
      try {
        const { squadId, amountCoins, bankName, iban } = request.body as any;

        if (!squadId || !amountCoins || !bankName || !iban) {
          return reply.status(400).send({
            success: false,
            message: "squadId, amountCoins, bankName and iban are required",
          });
        }

        const squad = await Squad.findById(squadId);
        if (!squad) {
          return reply
            .status(404)
            .send({ success: false, message: "Squad not found" });
        }

        // Only leader can request withdrawal
        const userId = request.user?.id as string;
        if (!userId || squad.leader.toString() !== userId) {
          return reply.status(403).send({
            success: false,
            message: "Only squad leader can request withdrawal",
          });
        }

        if (amountCoins <= 0) {
          return reply.status(400).send({
            success: false,
            message: "Amount must be greater than 0",
          });
        }

        if ((squad.currentBountyCoins || 0) < amountCoins) {
          return reply.status(400).send({
            success: false,
            message: "Insufficient squad bounty coin balance",
          });
        }

        // Convert coins to MNT using division pricing
        const divisionInfo = getDivisionInfo(squad.division);
        const amountMNT = Math.round(
          (amountCoins / divisionInfo.bountyCoinAmount) *
            divisionInfo.bountyCoinPrice
        );

        const withdraw = new WithdrawRequest({
          squadId: squad._id,
          requestedBy: userId,
          amountCoins,
          amountMNT,
          bankName: String(bankName).trim(),
          iban: String(iban).trim(),
          status: "PENDING",
        });

        await withdraw.save();

        // Reserve coins now by deducting from currentBountyCoins
        squad.currentBountyCoins =
          (squad.currentBountyCoins || 0) - amountCoins;
        squad.totalBountyCoinsSpent =
          (squad.totalBountyCoinsSpent || 0) + amountCoins;
        await squad.save();

        // Also reflect in BountyCoin transactions for leader's account snapshot
        let bountyCoinData = await BountyCoin.findOne({ userId });
        if (!bountyCoinData) {
          bountyCoinData = new BountyCoin({
            userId,
            balance: 0,
            totalEarned: 0,
            totalSpent: 0,
            transactions: [],
          });
        }
        bountyCoinData.transactions.push({
          type: "withdraw",
          amount: amountCoins,
          description: `Withdraw request to ${bankName} (${iban})`,
          timestamp: new Date(),
        } as any);
        bountyCoinData.balance = Math.max(
          0,
          (bountyCoinData.balance || 0) - amountCoins
        );
        bountyCoinData.totalSpent =
          (bountyCoinData.totalSpent || 0) + amountCoins;
        await bountyCoinData.save();

        return reply.send({ success: true, data: withdraw });
      } catch (error) {
        console.error("Error creating withdraw request:", error);
        return reply
          .status(500)
          .send({ success: false, message: "Internal server error" });
      }
    }
  );

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

  // Approve or reject withdraw request (admin only)
  fastify.post(
    "/withdraw/:id/decision",
    { preHandler: [authenticateToken] },
    async (request: any, reply) => {
      try {
        const { id } = request.params as any;
        const { decision, adminNotes } = request.body as any; // APPROVE | REJECT
        const user = request.user;

        if (user?.role !== "ADMIN") {
          return reply
            .status(403)
            .send({ success: false, message: "Admin only" });
        }

        if (!decision || !["APPROVE", "REJECT"].includes(decision)) {
          return reply.status(400).send({
            success: false,
            message: "decision must be APPROVE or REJECT",
          });
        }

        const wr = await WithdrawRequest.findById(id);
        if (!wr)
          return reply
            .status(404)
            .send({ success: false, message: "Request not found" });
        if (wr.status !== "PENDING") {
          return reply
            .status(400)
            .send({ success: false, message: "Request already processed" });
        }

        wr.status = decision === "APPROVE" ? "APPROVED" : "REJECTED";
        wr.adminNotes = adminNotes;
        wr.processedBy = user.id;
        wr.processedAt = new Date();
        await wr.save();

        // If rejected, refund the coins to the squad
        if (wr.status === "REJECTED") {
          const squad = await Squad.findById(wr.squadId);
          if (squad) {
            squad.currentBountyCoins =
              (squad.currentBountyCoins || 0) + wr.amountCoins;
            squad.totalBountyCoinsSpent = Math.max(
              0,
              (squad.totalBountyCoinsSpent || 0) - wr.amountCoins
            );
            await squad.save();
          }
        }

        return reply.send({ success: true, data: wr });
      } catch (error) {
        console.error("Error deciding withdraw request:", error);
        return reply
          .status(500)
          .send({ success: false, message: "Internal server error" });
      }
    }
  );

  // Mark withdraw request as paid (admin only)
  fastify.post(
    "/withdraw/:id/mark-paid",
    { preHandler: [authenticateToken] },
    async (request: any, reply) => {
      try {
        const { id } = request.params as any;
        const user = request.user;

        if (user?.role !== "ADMIN") {
          return reply
            .status(403)
            .send({ success: false, message: "Admin only" });
        }

        const wr = await WithdrawRequest.findById(id);
        if (!wr)
          return reply
            .status(404)
            .send({ success: false, message: "Request not found" });

        if (wr.status !== "APPROVED") {
          return reply.status(400).send({
            success: false,
            message: "Only approved requests can be marked as paid",
          });
        }

        wr.status = "PAID";
        wr.paidBy = user.id;
        wr.paidAt = new Date();
        await wr.save();

        return reply.send({
          success: true,
          data: wr,
          message: "Withdraw request marked as paid successfully",
        });
      } catch (error) {
        console.error("Error marking withdraw as paid:", error);
        return reply
          .status(500)
          .send({ success: false, message: "Internal server error" });
      }
    }
  );

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

  // Approve or reject purchase request (admin only)
  fastify.post(
    "/purchase/:id/decision",
    { preHandler: [authenticateToken] },
    async (request: any, reply) => {
      try {
        const { id } = request.params as any;
        const { decision, adminNotes } = request.body as any; // APPROVE | REJECT
        const user = request.user;

        if (user?.role !== "ADMIN") {
          return reply
            .status(403)
            .send({ success: false, message: "Admin only" });
        }

        if (!decision || !["APPROVE", "REJECT"].includes(decision)) {
          return reply.status(400).send({
            success: false,
            message: "decision must be APPROVE or REJECT",
          });
        }

        const pr = await PurchaseRequest.findById(id);
        if (!pr)
          return reply
            .status(404)
            .send({ success: false, message: "Request not found" });
        if (pr.status !== "PENDING") {
          return reply
            .status(400)
            .send({ success: false, message: "Request already processed" });
        }

        pr.status = decision === "APPROVE" ? "APPROVED" : "REJECTED";
        pr.adminNotes = adminNotes;
        pr.processedBy = user.id;
        pr.processedAt = new Date();
        await pr.save();

        // If approved, add coins to the squad
        if (pr.status === "APPROVED") {
          const squad = await Squad.findById(pr.squadId);
          if (squad) {
            squad.currentBountyCoins =
              (squad.currentBountyCoins || 0) + pr.amount;
            squad.totalBountyCoinsEarned =
              (squad.totalBountyCoinsEarned || 0) + pr.amount;
            await squad.save();

            // Add transaction to BountyCoin for the leader
            let bountyCoinData = await BountyCoin.findOne({
              userId: pr.requestedBy,
            });
            if (!bountyCoinData) {
              bountyCoinData = new BountyCoin({
                userId: pr.requestedBy,
                balance: 0,
                totalEarned: 0,
                totalSpent: 0,
                transactions: [],
              });
            }
            bountyCoinData.transactions.push({
              type: "purchase",
              amount: pr.amount,
              description: `Bounty coin purchase approved by admin`,
              timestamp: new Date(),
            } as any);
            bountyCoinData.balance = (bountyCoinData.balance || 0) + pr.amount;
            bountyCoinData.totalEarned =
              (bountyCoinData.totalEarned || 0) + pr.amount;
            await bountyCoinData.save();
          }
        }

        return reply.send({ success: true, data: pr });
      } catch (error) {
        console.error("Error deciding purchase request:", error);
        return reply
          .status(500)
          .send({ success: false, message: "Internal server error" });
      }
    }
  );
};

export default bountyCoinRoutes;
