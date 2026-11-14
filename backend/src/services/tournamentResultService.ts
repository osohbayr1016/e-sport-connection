import mongoose from "mongoose";
import TournamentMatch from "../models/TournamentMatch";
import { DivisionService } from "./divisionService";

export class MatchResultError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "MatchResultError";
  }
}
const invalid = (status: number, message: string): never => { throw new MatchResultError(status, message); };

export async function finalizeMatchWithRewards(matchId: string, input: {
  winnerId: string;
  loserId: string;
  score?: { squad1Score: number; squad2Score: number };
  adminNotes?: string;
  applyLoserDeduction?: boolean;
}) {
  if (!mongoose.isValidObjectId(matchId) ||
      !mongoose.isValidObjectId(input?.winnerId) ||
      !mongoose.isValidObjectId(input?.loserId) ||
      input.winnerId === input.loserId) {
    invalid(400, "Match, winner and loser IDs must be valid and distinct");
  }
  if (input.score !== undefined &&
      (!input.score || !Number.isSafeInteger(input.score.squad1Score) ||
        !Number.isSafeInteger(input.score.squad2Score) ||
        input.score.squad1Score < 0 || input.score.squad2Score < 0 ||
        input.score.squad1Score === input.score.squad2Score)) {
    invalid(400, "Scores must be non-negative integers with a clear winner");
  }
  if (input.adminNotes && (typeof input.adminNotes !== "string" || input.adminNotes.length > 1000)) {
    invalid(400, "Invalid admin notes");
  }

  const session = await mongoose.startSession();
  let match: InstanceType<typeof TournamentMatch> | undefined;
  try {
    await session.withTransaction(async () => {
      const current = await TournamentMatch.findById(matchId).session(session);
      if (!current) invalid(404, "Match not found");
      if (current.status === "completed" || current.divisionChangesProcessed) {
        invalid(409, "Match result was already processed");
      }
      if (!["scheduled", "in_progress"].includes(current.status) ||
          current.matchType === "auto_win" || !current.squad2) {
        invalid(409, "Match cannot accept a result");
      }
      const first = current.squad1.toString();
      const second = current.squad2.toString();
      const validPair = (input.winnerId === first && input.loserId === second) ||
        (input.winnerId === second && input.loserId === first);
      if (!validPair) invalid(400, "Winner and loser must be participating squads");
      if (input.score) {
        const winnerScore = input.winnerId === first ? input.score.squad1Score : input.score.squad2Score;
        const loserScore = input.loserId === first ? input.score.squad1Score : input.score.squad2Score;
        if (winnerScore <= loserScore) invalid(400, "Scores must agree with the chosen winner");
      }
      current.winner = new mongoose.Types.ObjectId(input.winnerId);
      current.loser = new mongoose.Types.ObjectId(input.loserId);
      current.status = "completed";
      current.endTime = new Date();
      if (input.score !== undefined) current.score = input.score;
      if (input.adminNotes !== undefined) current.adminNotes = input.adminNotes;
      if (input.applyLoserDeduction !== undefined) current.applyLoserDeduction = input.applyLoserDeduction;
      await current.save({ session });
      // One transaction: an error crediting either squad rolls back the result.
      await DivisionService.processMatchResult(matchId, session);
      match = current;
    });
  } finally {
    await session.endSession();
  }
  if (!match) throw new Error("Match completion did not commit");
  return match;
}
