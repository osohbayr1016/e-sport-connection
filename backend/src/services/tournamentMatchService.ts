import mongoose from "mongoose";
import TournamentMatch from "../models/TournamentMatch";
import TournamentRegistration from "../models/TournamentRegistration";

// Helper function to shuffle array
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate bracket matches based on tournament format
export function generateBracketMatches(
  squads: any[],
  format: string,
  tournamentId: string
): any[] {
  const matches = [];
  let matchNumber = 1;
  let round = 1;

  if (format === "Single Elimination") {
    const shuffledSquads = shuffleArray([...squads]);

    if (shuffledSquads.length % 2 !== 0) {
      shuffledSquads.push(null); // null represents a bye
    }

    for (let i = 0; i < shuffledSquads.length; i += 2) {
      if (shuffledSquads[i] && shuffledSquads[i + 1]) {
        matches.push({
          tournament: new mongoose.Types.ObjectId(tournamentId),
          matchNumber: matchNumber++,
          round: round,
          squad1: shuffledSquads[i]._id,
          squad2: shuffledSquads[i + 1]._id,
          status: "scheduled",
          scheduledTime: new Date(),
          bountyCoinAmount: 50,
          matchType: "normal",
        });
      } else if (shuffledSquads[i]) {
        matches.push({
          tournament: new mongoose.Types.ObjectId(tournamentId),
          matchNumber: matchNumber++,
          round: round,
          squad1: shuffledSquads[i]._id,
          squad2: null,
          status: "completed",
          winner: shuffledSquads[i]._id,
          matchType: "auto_win",
          bountyCoinAmount: 50,
        });
      }
    }
  } else if (format === "Double Elimination") {
    const shuffledSquads = shuffleArray([...squads]);

    // Winners bracket
    for (let i = 0; i < shuffledSquads.length; i += 2) {
      if (shuffledSquads[i] && shuffledSquads[i + 1]) {
        matches.push({
          tournament: new mongoose.Types.ObjectId(tournamentId),
          matchNumber: matchNumber++,
          round: round,
          squad1: shuffledSquads[i]._id,
          squad2: shuffledSquads[i + 1]._id,
          status: "scheduled",
          scheduledTime: new Date(),
          bountyCoinAmount: 50,
          matchType: "winners_bracket",
        });
      }
    }

    // Losers bracket will be generated after first round results
  } else if (format === "Round Robin") {
    const shuffledSquads = shuffleArray([...squads]);

    for (let i = 0; i < shuffledSquads.length; i++) {
      for (let j = i + 1; j < shuffledSquads.length; j++) {
        matches.push({
          tournament: new mongoose.Types.ObjectId(tournamentId),
          matchNumber: matchNumber++,
          round: round,
          squad1: shuffledSquads[i]._id,
          squad2: shuffledSquads[j]._id,
          status: "scheduled",
          scheduledTime: new Date(),
          bountyCoinAmount: 50,
          matchType: "round_robin",
        });
      }
    }
  }

  return matches;
}

// Generate tournament matches for a specific tournament
export async function generateTournamentMatches(
  tournamentId: string,
  session?: mongoose.ClientSession
): Promise<void> {
  if (!session) {
    const ownSession = await mongoose.startSession();
    try {
      await ownSession.withTransaction(async () => {
        await generateTournamentMatches(tournamentId, ownSession);
      });
    } finally {
      await ownSession.endSession();
    }
    return;
  }
  try {
    // Get all registered squads for this tournament
    const registrations = await TournamentRegistration.find({
      tournament: tournamentId,
      status: "registered",
      isApproved: true,
      isBanned: { $ne: true },
    }).populate("squad").session(session);

    if (registrations.length < 2) {
      throw new Error("Need at least 2 squads to generate matches");
    }

    const squads = registrations.map((reg) => reg.squad);

    // Get tournament format
    const { default: Tournament } = await import("../models/Tournament");
    const tournament = await Tournament.findById(tournamentId).session(session);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Prevent duplicate brackets even if the caller bypasses the route-level guard.
    if (await TournamentMatch.exists({ tournament: tournamentId }).session(session)) {
      throw new Error("Matches already generated for this tournament");
    }
    if (!["Single Elimination", "Round Robin"].includes(tournament.format)) {
      throw new Error("Unsupported tournament format");
    }

    // Generate matches based on tournament format
    const matches = generateBracketMatches(
      squads,
      tournament.format,
      tournamentId
    );

    // Save matches to database
    await TournamentMatch.insertMany(matches, { session });

    } catch (error) {
    console.error("Error generating tournament matches:", error);
    throw error;
  }
}


export async function startTournamentWithBrackets(tournamentId: string): Promise<void> {
  if (!mongoose.isValidObjectId(tournamentId)) throw new Error("Invalid tournament ID");
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { default: Tournament } = await import("../models/Tournament");
      // The status transition locks competing starts, and rolls back if match generation fails.
      const started = await Tournament.findOneAndUpdate({
        _id: tournamentId,
        status: { $in: ["upcoming", "registration_open", "registration_closed"] },
      }, { $set: { status: "ongoing", startDate: new Date() } }, { session, new: true });
      if (!started) throw new Error("Tournament already started, cancelled or missing");
      if (started.format === "Double Elimination") {
        throw new Error("Double-elimination progression is not implemented. Choose a supported bracket before starting.");
      }
      await generateTournamentMatches(tournamentId, session);
    });
  } finally {
    await session.endSession();
  }
}


// Progression must be serialized across all API instances. A committed match
// can be safely retried using the admin recovery endpoint below.
export async function advanceCompletedTournamentRound(
  tournamentId: string,
  round: number
): Promise<"not_ready" | "advanced" | "completed" | "skipped" | "already_advanced"> {
  if (!mongoose.isValidObjectId(tournamentId) || !Number.isSafeInteger(round) || round < 1) {
    throw new Error("Invalid tournament or round");
  }
  const { default: Tournament } = await import("../models/Tournament");
  const session = await mongoose.startSession();
  let result: "not_ready" | "advanced" | "completed" | "skipped" | "already_advanced" = "not_ready";
  try {
    await session.withTransaction(async () => {
      // A real DB write locks the tournament and forces concurrent progressors
      // to retry rather than generating duplicate match numbers or rounds.
      const tournament = await Tournament.findOneAndUpdate(
        { _id: tournamentId, status: "ongoing" },
        { $inc: { bracketRevision: 1 } },
        { session, new: true }
      );
      if (!tournament) { result = "skipped"; return; }
      const currentRound = await TournamentMatch.find({
        tournament: tournamentId, round,
      }).sort({ matchNumber: 1 }).session(session);
      if (!currentRound.length || currentRound.some(match => match.status !== "completed" || !match.winner)) {
        result = "not_ready"; return;
      }
      if (tournament.format === "Round Robin") {
        // Round-robin is pre-generated as a complete schedule. Never
        // transform it into a single-elimination bracket.
        const outstanding = await TournamentMatch.exists({
          tournament: tournamentId, status: { $ne: "completed" },
        }).session(session);
        if (!outstanding) {
          await Tournament.updateOne({ _id: tournamentId, status: "ongoing" },
            { $set: { status: "completed", endDate: new Date() } }, { session });
          result = "completed";
        } else result = "not_ready";
        return;
      }
      if (tournament.format !== "Single Elimination") {
        result = "skipped"; return; // Double-elimination progression needs its own engine.
      }
      const nextRound = round + 1;
      if (await TournamentMatch.exists({ tournament: tournamentId, round: nextRound }).session(session)) {
        result = "already_advanced"; return;
      }
      const winners = currentRound.map(match => match.winner!.toString());
      if (new Set(winners).size !== winners.length) {
        throw new Error("Duplicate winner in tournament bracket");
      }
      if (winners.length === 1) {
        await Tournament.updateOne({ _id: tournamentId, status: "ongoing" },
          { $set: { status: "completed", endDate: new Date() } }, { session });
        result = "completed";
        return;
      }
      const last = await TournamentMatch.findOne({ tournament: tournamentId })
        .sort({ matchNumber: -1 }).session(session);
      let matchNumber = (last?.matchNumber || 0) + 1;
      const created = [];
      for (let index = 0; index < winners.length; index += 2) {
        const left = winners[index], right = winners[index + 1];
        created.push({
          tournament: new mongoose.Types.ObjectId(tournamentId),
          matchNumber: matchNumber++,
          round: nextRound,
          squad1: new mongoose.Types.ObjectId(left),
          squad2: right ? new mongoose.Types.ObjectId(right) : null,
          ...(right ? { status: "scheduled", matchType: "normal" } :
            { status: "completed", matchType: "auto_win", winner: new mongoose.Types.ObjectId(left), bountyCoinAmount: 0 }),
        });
      }
      await TournamentMatch.insertMany(created, { session });
      result = "advanced";
    });
  } finally {
    await session.endSession();
  }
  return result;
}

// Get squad statistics for a tournament
export function getSquadStats(matches: any[]): Record<string, any> {
  const stats: Record<string, any> = {};

  matches.forEach((match) => {
    if (match.squad1 && match.squad2) {
      // Initialize squad stats if they don't exist
      if (!stats[match.squad1._id]) {
        stats[match.squad1._id] = { wins: 0, losses: 0, bountyCoins: 0 };
      }
      if (!stats[match.squad2._id]) {
        stats[match.squad2._id] = { wins: 0, losses: 0, bountyCoins: 0 };
      }

      // Update stats based on match result
      if (match.winner) {
        if (match.winner === match.squad1._id) {
          stats[match.squad1._id].wins++;
          stats[match.squad2._id].losses++;
          stats[match.squad1._id].bountyCoins += match.bountyCoinAmount || 50;
          stats[match.squad2._id].bountyCoins -= 25;
        } else {
          stats[match.squad2._id].wins++;
          stats[match.squad1._id].losses++;
          stats[match.squad2._id].bountyCoins += match.bountyCoinAmount || 50;
          stats[match.squad1._id].bountyCoins -= 25;
        }
      }
    }
  });

  return stats;
}

// Disqualify a squad from a tournament: mark registration banned and
// set all pending matches involving the squad as walkover wins for the opponent.
export async function disqualifySquadFromTournament(
  tournamentId: string,
  squadId: string,
  options?: { reason?: string; adminId?: string }
): Promise<{ updatedMatches: number }> {
  const session = await (await import("mongoose")).default.startSession();
  session.startTransaction();
  try {
    const registration = await TournamentRegistration.findOne({
      tournament: tournamentId,
      squad: squadId,
    }).session(session);

    if (!registration) {
      throw new Error("Registration not found for this squad in tournament");
    }

    // Mark as banned
    registration.isBanned = true;
    registration.status = "eliminated";
    registration.banReason = options?.reason;
    registration.bannedAt = new Date();
    if (options?.adminId) {
      // @ts-ignore
      registration.bannedBy = options.adminId;
    }
    await registration.save({ session });

    // Find all matches not completed/cancelled where squad is involved
    const pendingMatches = await TournamentMatch.find({
      tournament: tournamentId,
      status: { $in: ["scheduled", "in_progress"] },
      $or: [{ squad1: squadId }, { squad2: squadId }],
    }).session(session);

    let updatedCount = 0;
    for (const match of pendingMatches) {
      const opponent =
        match.squad1.toString() === squadId ? match.squad2 : match.squad1;

      // If opponent is null (bye) or undefined, cancel the match
      if (!opponent) {
        match.status = "cancelled";
        match.adminNotes = `Match cancelled due to disqualification of squad ${squadId}`;
      } else {
        match.status = "completed";
        match.winner = opponent as any;
        match.loser = new (await import("mongoose")).default.Types.ObjectId(
          squadId
        ) as any;
        match.matchType = "walkover" as any;
        match.isWalkover = true;
        match.walkoverReason = options?.reason || "Disqualified";
        match.endTime = new Date();
      }
      await match.save({ session });
      updatedCount += 1;
    }

    await session.commitTransaction();
    session.endSession();
    return { updatedMatches: updatedCount };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}
