import { FastifyPluginAsync } from "fastify";
import { DivisionService } from "../services/divisionService";
import Squad, { SquadDivision } from "../models/Squad";
import { canUpgradeDivision, DIVISION_CONFIG } from "../utils/divisionSystem";

const divisionRoutes: FastifyPluginAsync = async (fastify, options) => {
  // Get division leaderboard
  fastify.get("/leaderboard/:division", async (request, reply) => {
    try {
      const { division } = request.params as { division: string };
      const limit = parseInt((request.query as any).limit as string) || 50;

      if (!Object.values(SquadDivision).includes(division as SquadDivision)) {
        return reply.status(400).send({ error: "Invalid division" });
      }

      const leaderboard = await DivisionService.getDivisionLeaderboard(
        division as SquadDivision,
        limit
      );

      return reply.send({ success: true, data: leaderboard });
    } catch (error) {
      console.error("Error getting division leaderboard:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // Get squad division info
  fastify.get("/squad/:squadId", async (request, reply) => {
    try {
      const { squadId } = request.params as { squadId: string };
      const divisionInfo = await DivisionService.getSquadDivisionInfo(squadId);

      return reply.send({ success: true, data: divisionInfo });
    } catch (error) {
      console.error("Error getting squad division info:", error);
      if (error instanceof Error && error.message === "Squad not found") {
        return reply.status(404).send({ error: "Squad not found" });
      }
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // Use protection (requires authentication)
  fastify.post("/protection/:squadId", async (request, reply) => {
    try {
      const { squadId } = request.params as { squadId: string };

      // Check if user is squad leader or member
      // This would need to be implemented based on your squad membership logic

      await DivisionService.useProtection(squadId);

      return reply.send({
        success: true,
        message: "Protection used successfully",
      });
    } catch (error) {
      console.error("Error using protection:", error);
      if (error instanceof Error && error.message === "Squad not found") {
        return reply.status(404).send({ error: "Squad not found" });
      }
      if (
        error instanceof Error &&
        error.message === "No protections remaining"
      ) {
        return reply.status(400).send({ error: "No protections remaining" });
      }
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // Purchase bounty coins (requires authentication)
  fastify.post("/purchase/:squadId", async (request, reply) => {
    try {
      const { squadId } = request.params as { squadId: string };
      const { amount } = request.body as { amount: number };

      if (!amount || amount <= 0) {
        return reply.status(400).send({ error: "Invalid amount" });
      }

      // Validate amount is multiple of 50
      if (amount % 50 !== 0) {
        return reply
          .status(400)
          .send({ error: "Amount must be multiple of 50" });
      }

      const result = await DivisionService.purchaseBountyCoins(squadId, amount);

      return reply.send({ success: true, data: result });
    } catch (error) {
      console.error("Error purchasing bounty coins:", error);
      if (error instanceof Error && error.message === "Squad not found") {
        return reply.status(404).send({ error: "Squad not found" });
      }
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // Upgrade division by spending bounty coins (leader-only)
  fastify.post("/upgrade/:squadId", async (request, reply) => {
    try {
      const { squadId } = request.params as { squadId: string };
      const { userId } = request.body as { userId: string };

      if (!userId) {
        return reply.status(400).send({ error: "User ID is required" });
      }

      const squad = await Squad.findById(squadId);
      if (!squad) {
        return reply.status(404).send({ error: "Squad not found" });
      }

      // Only leader can upgrade
      if (squad.leader.toString() !== userId) {
        return reply
          .status(403)
          .send({ error: "Only squad leader can upgrade division" });
      }

      const upgradeCost = DIVISION_CONFIG[squad.division].upgradeCost;
      const hasEnough = canUpgradeDivision(
        squad.division,
        squad.currentBountyCoins
      );

      if (!hasEnough || !isFinite(upgradeCost)) {
        return reply
          .status(400)
          .send({ error: "Upgrade not available for current division" });
      }

      await DivisionService.upgradeSquadDivision(squad);

      return reply.send({
        success: true,
        data: {
          squadId: squad._id,
          newDivision: squad.division,
          newBalance: squad.currentBountyCoins,
          coinsSpent: upgradeCost,
        },
      });
    } catch (error) {
      console.error("Error upgrading division:", error);
      if (
        error instanceof Error &&
        error.message === "Cannot upgrade further"
      ) {
        return reply.status(400).send({ error: "Cannot upgrade further" });
      }
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // Get all divisions info
  fastify.get("/info", async (request, reply) => {
    try {
      const divisions = Object.values(SquadDivision).map((division) => ({
        name: division,
        displayName:
          division === SquadDivision.SILVER
            ? "Silver Division"
            : division === SquadDivision.GOLD
            ? "Gold Division"
            : "Diamond Division",
        requirements:
          division === SquadDivision.SILVER
            ? "0-250 Bounty Coins"
            : division === SquadDivision.GOLD
            ? "0-750 Bounty Coins"
            : "0+ Bounty Coins",
        upgradeCost:
          division === SquadDivision.SILVER
            ? 250
            : division === SquadDivision.GOLD
            ? 750
            : null,
        bountyCoinPrice:
          division === SquadDivision.SILVER
            ? 10000
            : division === SquadDivision.GOLD
            ? 20000
            : 30000,
        bountyCoinAmount: 50,
        deductionAmount: 25,
      }));

      return reply.send({ success: true, data: divisions });
    } catch (error) {
      console.error("Error getting divisions info:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // Process match result (admin only)
  fastify.post("/process-match/:matchId", async (request, reply) => {
    try {
      const { matchId } = request.params as { matchId: string };

      // Check if user is admin (implement your admin check logic here)
      // if (!request.user.isAdmin) {
      //   return reply.status(403).send({ error: "Admin access required" });
      // }

      await DivisionService.processMatchResult(matchId);

      return reply.send({
        success: true,
        message: "Match result processed successfully",
      });
    } catch (error) {
      console.error("Error processing match result:", error);
      if (
        error instanceof Error &&
        error.message === "Match not found or not completed"
      ) {
        return reply
          .status(404)
          .send({ error: "Match not found or not completed" });
      }
      return reply.status(500).send({ error: "Internal server error" });
    }
  });
};

export default divisionRoutes;
