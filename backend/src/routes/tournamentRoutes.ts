import TournamentMatch from "../models/TournamentMatch";
import { createTournamentRegistration, handleTournamentRegistrationError } from "../services/tournamentRegistrationService";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import { FastifyInstance, FastifyPluginAsync } from "fastify";
import mongoose from "mongoose";
import Tournament from "../models/Tournament";
import TournamentRegistration from "../models/TournamentRegistration";

class TournamentDeletionError extends Error {
  constructor(public statusCode: number, message: string) { super(message); }
}

const tournamentRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance
) => {
  // Health check
  fastify.get("/health", async (request, reply) => {
    return reply.send({
      success: true,
      message: "Tournament routes available",
      timestamp: new Date().toISOString(),
    });
  });

  // Get all tournaments with pagination and filtering
  fastify.get("/", async (request, reply) => {
    try {
      const {
        page = 1,
        limit = 10,
        game,
        status,
        search,
        organizer,
      } = request.query as any;

      const query: any = {};

      // Apply filters
      if (game && game !== "All") {
        query.game = game;
      }

      if (status && status !== "All") {
        query.status = status;
      }

      if (organizer) {
        query.organizer = { $regex: organizer, $options: "i" };
      }

      if (search) {
        query.$text = { $search: search };
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const projection = {
        name: 1,
        game: 1,
        description: 1,
        organizer: 1,
        organizerLogo: 1,
        startDate: 1,
        endDate: 1,
        registrationDeadline: 1,
        prizePool: 1,
        entryFee: 1,
        tournamentType: 1,
        format: 1,
        location: 1,
        status: 1,
        maxSquads: 1,
        currentSquads: 1,
        createdAt: 1,
        updatedAt: 1,
      } as const;

      const [tournaments, total] = await Promise.all([
        Tournament.find(query, projection)
          .sort({ startDate: 1, createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Tournament.countDocuments(query),
      ]);

      // Cache list responses briefly to improve perceived performance
      reply.header(
        "Cache-Control",
        "public, max-age=30, s-maxage=60, stale-while-revalidate=120"
      );

      return reply.status(200).send({
        success: true,
        tournaments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Get tournaments error:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to get tournaments",
      });
    }
  });

  // Get tournament by ID
  fastify.get("/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const tournament = await Tournament.findById(id).lean();

      if (!tournament) {
        return reply.status(404).send({
          success: false,
          message: "Tournament not found",
        });
      }

      return reply.status(200).send({
        success: true,
        tournament,
      });
    } catch (error) {
      console.error("Get tournament by ID error:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to get tournament",
      });
    }
  });

  // Create tournament (admin only)
  fastify.post("/", { preHandler: [authenticateToken, requireAdmin] }, async (request, reply) => {
    try {
      const tournamentData = request.body as any;

      // Validate required fields
      const requiredFields = [
        "name",
        "description",
        "game",
        "startDate",
        "endDate",
        "prizePool",
        "maxSquads",
        "location",
        "organizer",
        "registrationDeadline",
      ];
      const maxSquads = tournamentData.maxSquads ?? tournamentData.maxParticipants;
      const missingFields = requiredFields.filter((field) => {
        if (field === "maxSquads") return maxSquads === undefined || maxSquads === null;
        const value = tournamentData[field];
        return value === undefined || value === null ||
          (typeof value === "string" && !value.trim());
      });
      if (!Number.isSafeInteger(Number(maxSquads)) || Number(maxSquads) < 2 || Number(maxSquads) > 256) {
        return reply.status(400).send({ success: false, message: "maxSquads must be between 2 and 256" });
      }

      if (missingFields.length > 0) {
        return reply.status(400).send({
          success: false,
          message: `Missing required fields: ${missingFields.join(", ")}`,
          missingFields,
        });
      }

      // Validate dates
      const startDate = new Date(tournamentData.startDate);
      const endDate = new Date(tournamentData.endDate);
      const registrationDeadline = new Date(
        tournamentData.registrationDeadline
      );

      if (![startDate, endDate, registrationDeadline].every(d => Number.isFinite(d.getTime()))) {
        return reply.status(400).send({ success: false, message: "Invalid tournament date" });
      }
      if (startDate >= endDate) {
        return reply.status(400).send({
          success: false,
          message: "End date must be after start date",
        });
      }

      // Relax validation: allow registration deadline to be on/after start date,
      // since registration stays open until admin starts the tournament.

      // Only accept recognized organizer fields. All lifecycle, bracket
      // and participant counts are created by the tournament engine.
      const organizerFields = [
        "name", "description", "game", "startDate", "endDate", "prizePool",
        "prizeDistribution", "location", "organizer", "organizerLogo",
        "bannerImage", "rules", "registrationDeadline", "entryFee",
        "tournamentType", "format",
      ];
      const sanitized: Record<string, unknown> = {};
      for (const key of organizerFields) {
        if (Object.prototype.hasOwnProperty.call(tournamentData, key)) {
          sanitized[key] = tournamentData[key];
        }
      }
      const newTournament = new Tournament({
        ...sanitized,
        maxSquads: Number(maxSquads),
        status: "upcoming",
        currentSquads: 0,
        entryFee: tournamentData.tournamentType === "free" ? 0 : tournamentData.entryFee,
      });
      await newTournament.save();

      return reply.status(201).send({
        success: true,
        message: "Tournament created successfully",
        tournament: newTournament,
      });
    } catch (error) {
      console.error("Create tournament error:", error);

      if (error.name === "ValidationError") {
        const validationErrors = Object.values(error.errors).map(
          (err: any) => err.message
        );
        return reply.status(400).send({
          success: false,
          message: "Validation failed",
          errors: validationErrors,
        });
      }

      return reply.status(500).send({
        success: false,
        message: "Failed to create tournament",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });

  // Update display/settings only. State, participant count and brackets are server-controlled.
  fastify.put("/:id", { preHandler: [authenticateToken, requireAdmin] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      if (!mongoose.isValidObjectId(id)) {
        return reply.status(400).send({ success: false, message: "Invalid tournament ID" });
      }
      const payload = request.body as Record<string, unknown>;
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return reply.status(400).send({ success: false, message: "Expected tournament fields" });
      }
      const editable = new Set([
        "name", "description", "game", "startDate", "endDate", "prizePool",
        "prizeDistribution", "maxSquads", "location", "organizer",
        "organizerLogo", "bannerImage", "rules", "registrationDeadline",
        "entryFee", "tournamentType", "format",
      ]);
      const keys = Object.keys(payload);
      if (!keys.length || keys.some(key => !editable.has(key))) {
        return reply.status(400).send({
          success: false, message: "Unsupported or server-managed tournament field",
        });
      }
      const current = await Tournament.findById(id);
      if (!current) return reply.status(404).send({ success: false, message: "Tournament not found" });
      if (["ongoing", "completed", "cancelled"].includes(current.status)) {
        return reply.status(409).send({ success: false, message: "Active or finished tournament settings are locked" });
      }
      const protectedFields = ["game", "format", "tournamentType", "entryFee", "registrationDeadline"];
      if (current.currentSquads > 0 && keys.some(key => protectedFields.includes(key))) {
        return reply.status(409).send({ success: false, message: "Competition format and payment terms are locked after registration" });
      }
      const maxSquads = payload.maxSquads === undefined ? current.maxSquads : Number(payload.maxSquads);
      if (!Number.isSafeInteger(maxSquads) || maxSquads < 2 || maxSquads > 256) {
        return reply.status(400).send({ success: false, message: "maxSquads must be an integer between 2 and 256" });
      }
      const startDate = new Date((payload.startDate ?? current.startDate) as string | Date);
      const endDate = new Date((payload.endDate ?? current.endDate) as string | Date);
      const deadline = new Date((payload.registrationDeadline ?? current.registrationDeadline) as string | Date);
      if (![startDate, endDate, deadline].every(date => Number.isFinite(date.getTime())) || startDate >= endDate) {
        return reply.status(400).send({ success: false, message: "Invalid tournament dates" });
      }
      if (payload.tournamentType === "free" && payload.entryFee !== undefined && Number(payload.entryFee) !== 0) {
        return reply.status(400).send({ success: false, message: "Free tournaments cannot charge an entry fee" });
      }
      if (payload.entryFee !== undefined &&
          (typeof payload.entryFee !== "number" || !Number.isFinite(payload.entryFee) || payload.entryFee < 0)) {
        return reply.status(400).send({ success: false, message: "Invalid entry fee" });
      }
      const changes: Record<string, unknown> = {};
      for (const key of keys) changes[key] = payload[key];
      if (payload.tournamentType === "free") changes.entryFee = 0;
      // Conditional write prevents shrinking below a concurrently reserved slot.
      const updated = await Tournament.findOneAndUpdate(
        { _id: id, status: { $in: ["upcoming", "registration_open", "registration_closed"] },
          currentSquads: { $lte: maxSquads },
          ...(protectedFields.some(key => keys.includes(key)) ? { currentSquads: 0 } : {}) },
        { $set: changes },
        { new: true, runValidators: true }
      );
      if (!updated) {
        return reply.status(409).send({ success: false, message: "Registration count or tournament status changed; refresh and retry" });
      }
      return reply.send({ success: true, message: "Tournament updated", tournament: updated });
    } catch (error: any) {
      if (error.name === "ValidationError" || error.name === "CastError") {
        return reply.status(400).send({ success: false, message: "Invalid tournament settings" });
      }
      request.log.error({ error }, "Tournament update failed");
      return reply.status(500).send({ success: false, message: "Unable to update tournament" });
    }
  });

  // A tournament with participants or matches cannot be hard-deleted.
  // Requiring an empty event prevents orphaned payment and bracket records.
  fastify.delete("/:id", { preHandler: [authenticateToken, requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!mongoose.isValidObjectId(id)) {
      return reply.status(400).send({ success: false, message: "Invalid tournament ID" });
    }
    const session = await mongoose.startSession();
    try {
      let deleted = false;
      await session.withTransaction(async () => {
        const tournament = await Tournament.findById(id).session(session);
        if (!tournament) return;
        if (!["upcoming", "registration_open", "registration_closed"].includes(tournament.status)) {
          throw new TournamentDeletionError(409, "Cannot delete an active or completed tournament");
        }
        const [participants, matches] = await Promise.all([
          TournamentRegistration.exists({ tournament: id }).session(session),
          TournamentMatch.exists({ tournament: id }).session(session),
        ]);
        if (participants || matches || tournament.currentSquads > 0) {
          throw new TournamentDeletionError(409, "Tournament contains participants or matches; do not erase its history");
        }
        const outcome = await Tournament.deleteOne({ _id: id }, { session });
        deleted = outcome.deletedCount === 1;
      });
      if (!deleted) return reply.status(404).send({ success: false, message: "Tournament not found" });
      return reply.send({ success: true, message: "Empty tournament deleted" });
    } catch (error) {
      if (error instanceof TournamentDeletionError) {
        return reply.status(error.statusCode).send({ success: false, message: error.message });
      }
      request.log.error({ error }, "Tournament delete failed");
      return reply.status(500).send({ success: false, message: "Failed to delete tournament" });
    } finally {
      await session.endSession();
    }
  });

  // Get tournament games
  fastify.get("/games/list", async (request, reply) => {
    try {
      const games = await Tournament.distinct("game");

      return reply.status(200).send({
        success: true,
        games,
      });
    } catch (error) {
      console.error("Get games error:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to get games",
      });
    }
  });

  // Get tournament organizers
  fastify.get("/organizers/list", async (request, reply) => {
    try {
      const organizers = await Tournament.distinct("organizer");

      return reply.status(200).send({
        success: true,
        organizers,
      });
    } catch (error) {
      console.error("Get organizers error:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to get organizers",
      });
    }
  });

  // Public list: approved participants only, never payment evidence or emails.
  fastify.get("/:id/registrations", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      if (!mongoose.isValidObjectId(id)) return reply.status(400).send({ success: false, message: "Invalid tournament ID" });
      const query = request.query as { page?: string; limit?: string };
      const page = Math.max(1, Number.parseInt(query.page || "1", 10) || 1);
      const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit || "10", 10) || 10));
      const filter = { tournament: id, isApproved: true, isBanned: { $ne: true } };
      const [registrations, total] = await Promise.all([
        TournamentRegistration.find(filter)
          .select("tournament squad squadLeader squadMembers registrationDate status isApproved approvalStatus")
          .populate("squad", "name tag logo")
          .populate("squadLeader", "name avatar")
          .populate("squadMembers", "name avatar")
          .sort({ registrationDate: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        TournamentRegistration.countDocuments(filter),
      ]);
      return reply.send({ success: true, registrations, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (error) {
      request.log.error({ error }, "Public registration list failed");
      return reply.status(500).send({ success: false, message: "Failed to get tournament participants" });
    }
  });

  // Legacy free tournament registration shares the transactional core.
  fastify.post("/:id/register", { preHandler: [authenticateToken] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { squadId } = request.body as { squadId: string };
      const result = await createTournamentRegistration({
        tournamentId: id, squadId, actorId: (request as any).user?.id, requireFree: true,
      });
      // Achievement side effects should never invalidate an already committed registration.
      try {
        const { AchievementService } = await import("../services/achievementService");
        for (const member of result.squad.members) {
          await AchievementService.processAchievementTrigger({
            userId: member,
            type: "tournament_participation",
            data: { game: result.tournament.game, tournamentId: result.tournament._id as mongoose.Types.ObjectId },
          });
        }
      } catch (error) {
        request.log.error({ error }, "Registration achievement delivery failed");
      }
      return reply.status(200).send({
        success: true, message: "Successfully registered for tournament",
        registration: result.registration,
      });
    } catch (error) {
      return handleTournamentRegistrationError(error, reply);
    }
  });

  // Start and generate matches atomically: no ongoing event without its first bracket.
  fastify.post("/:id/start", { preHandler: [authenticateToken, requireAdmin] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { startTournamentWithBrackets } = await import("../services/tournamentMatchService");
      await startTournamentWithBrackets(id);
      return reply.status(200).send({
        success: true,
        message: "Tournament started and matches generated",
        tournamentId: id,
      });
    } catch (error) {
      request.log.error({ error }, "Tournament start failed");
      return reply.status(409).send({
        success: false,
        message: error instanceof Error ? error.message : "Unable to start tournament",
      });
    }
  });

  // Disqualify/Ban a squad from a tournament (admin only)
  fastify.post("/:id/disqualify", { preHandler: [authenticateToken, requireAdmin] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { squadId, reason } = request.body as {
        squadId: string;
        reason?: string;
      };

      if (!squadId) {
        return reply.status(400).send({
          success: false,
          message: "squadId is required",
        });
      }

      const tournament = await Tournament.findById(id);
      if (!tournament) {
        return reply.status(404).send({
          success: false,
          message: "Tournament not found",
        });
      }

      const { disqualifySquadFromTournament } = await import(
        "../services/tournamentMatchService"
      );
      const result = await disqualifySquadFromTournament(id, squadId, {
        reason,
        adminId: (request as any).user?.id,
      });

      return reply.status(200).send({
        success: true,
        message: "Squad disqualified successfully",
        updatedMatches: result.updatedMatches,
      });
    } catch (error) {
      console.error("Disqualify squad error:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to disqualify squad",
        error:
          process.env.NODE_ENV === "development"
            ? (error as any).message
            : undefined,
      });
    }
  });
};

export default tournamentRoutes;
