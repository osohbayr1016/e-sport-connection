import Match, {
  MatchStatus,
  AdminResolution,
  IMatchEvidence,
} from "../models/Match";
import Squad from "../models/Squad";
import Notification from "../models/Notification";
import mongoose from "mongoose";

// Utility function to safely calculate win rate
function calculateWinRate(wins: number, losses: number, draws: number = 0): number {
  const totalMatches = wins + losses + draws;
  if (totalMatches === 0 || isNaN(wins) || isNaN(losses) || isNaN(draws)) {
    return 0;
  }
  return Math.round((wins / totalMatches) * 100);
}

export class MatchService3 {
  // Dispute үүсгэх (evidence + text)
  static async createDispute(
    matchId: string,
    userId: string,
    evidence: IMatchEvidence
  ) {
    console.log(`🚨 Creating dispute: matchId=${matchId}, userId=${userId}`);
    console.log(`📊 Evidence:`, evidence);
    
    const match = await Match.findById(matchId)
      .populate("challengerSquadId")
      .populate("opponentSquadId");

    if (!match) {
      throw new Error("Match олдсонгүй");
    }

    console.log(`📊 Match status: ${match.status}`);
    console.log(`📊 Match challengerResult: ${match.challengerResult}`);
    console.log(`📊 Match opponentResult: ${match.opponentResult}`);
    console.log(`📊 Evidence received:`, evidence);

    // Validate evidence - must have either images or description
    const hasImages = evidence.images && evidence.images.length > 0;
    const hasDescription = evidence.description && evidence.description.trim() !== '';
    
    console.log(`📊 Evidence validation: hasImages=${hasImages}, hasDescription=${hasDescription}`);
    
    if (!hasImages && !hasDescription) {
      console.log(`❌ Cannot create dispute - no evidence provided`);
      throw new Error("Хамгийн багадаа зураг эсвэл тайлбар оруулна уу");
    }

    // Check if dispute already exists - allow both teams to submit evidence
    if (match.status === MatchStatus.DISPUTED) {
      console.log(`📊 Match already disputed, allowing additional evidence submission`);
      // Allow both teams to submit evidence even if dispute already exists
    }

    // Allow disputes for matches that are playing or have results submitted
    // Also allow for matches that are completed but not yet resolved
    const allowedStatuses = [
      MatchStatus.PLAYING,
      MatchStatus.RESULT_SUBMITTED,
      MatchStatus.COMPLETED
    ];
    
    console.log(`📊 Status check: current=${match.status}, allowed=${allowedStatuses.join(', ')}`);
    console.log(`📊 Status in allowed list: ${allowedStatuses.includes(match.status)}`);
    
    if (!allowedStatuses.includes(match.status)) {
      console.log(`❌ Cannot create dispute - invalid status: ${match.status}`);
      console.log(`📊 Allowed statuses: ${allowedStatuses.join(', ')}`);
      throw new Error("Dispute үүсгэх боломжгүй");
    }

    // Leader эрх шалгах
    const challengerSquad: any = match.challengerSquadId;
    const opponentSquad: any = match.opponentSquadId;

    console.log(`📊 Squad validation: challengerLeader=${challengerSquad.leader}, opponentLeader=${opponentSquad.leader}, userId=${userId}`);

    const isChallenger = challengerSquad.leader.toString() === userId;
    const isOpponent = opponentSquad.leader.toString() === userId;

    console.log(`📊 User role: isChallenger=${isChallenger}, isOpponent=${isOpponent}`);

    if (!isChallenger && !isOpponent) {
      console.log(`❌ User is not a leader of either squad`);
      throw new Error("Зөвхөн leader dispute үүсгэх эрхтэй");
    }

    // Evidence хадгалах
    if (isChallenger) {
      console.log(`📊 Storing evidence for challenger`);
      match.challengerEvidence = evidence;
    } else {
      console.log(`📊 Storing evidence for opponent`);
      match.opponentEvidence = evidence;
    }

    // Update status to DISPUTED only if not already disputed
    if (match.status !== MatchStatus.DISPUTED) {
      console.log(`📊 Updating match status to DISPUTED`);
      match.status = MatchStatus.DISPUTED;
    }
    
    await match.save();
    console.log(`✅ Match saved with DISPUTED status`);

    // Admin-д notification илгээх
    const admins = await import("../models/User").then((m) =>
      m.default.find({ role: "ADMIN" })
    );

    for (const admin of admins) {
      await Notification.create({
        userId: admin._id,
        title: "Шинэ dispute",
        content: `${challengerSquad.name} vs ${opponentSquad.name} - Dispute шийдвэрлүүлэх хүсэлт`,
        type: "SYSTEM",
      });
    }

    return match;
  }

  // Admin dispute шийдвэрлэх
  static async resolveDispute(
    matchId: string,
    adminId: string,
    resolution: AdminResolution
  ) {
    const match = await Match.findById(matchId)
      .populate("challengerSquadId")
      .populate("opponentSquadId");

    if (!match) {
      throw new Error("Match олдсонгүй");
    }

    if (match.status !== MatchStatus.DISPUTED) {
      throw new Error("Match disputed статустай байхгүй байна");
    }

    // Check if both sides submitted NO evidence (no images and no text)
    const challengerHasEvidence =
      match.challengerEvidence?.images?.length > 0 ||
      match.challengerEvidence?.description;
    const opponentHasEvidence =
      match.opponentEvidence?.images?.length > 0 ||
      match.opponentEvidence?.description;

    // If neither side has evidence, force CANCELLED resolution
    if (!challengerHasEvidence && !opponentHasEvidence) {
      resolution = AdminResolution.CANCELLED;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const challengerSquad: any = match.challengerSquadId;
      const opponentSquad: any = match.opponentSquadId;

      match.adminResolution = resolution;
      match.resolvedBy = adminId as any;
      match.resolvedAt = new Date();

      switch (resolution) {
        case AdminResolution.SQUAD_A_WON:
          // Challenger ялсан
          await Squad.findByIdAndUpdate(
            challengerSquad._id,
            {
              $inc: {
                currentBountyCoins: match.bountyAmount * 2,
                "matchStats.wins": 1,
                "matchStats.totalMatches": 1,
                "matchStats.totalEarned": match.bountyAmount,
              },
              $setOnInsert: {
                "matchStats.winRate": 0,
              },
            },
            { session }
          );

          await Squad.findByIdAndUpdate(
            opponentSquad._id,
            {
              $inc: {
                "matchStats.losses": 1,
                "matchStats.totalMatches": 1,
                "matchStats.totalEarned": -match.bountyAmount,
              },
              $setOnInsert: {
                "matchStats.winRate": 0,
              },
            },
            { session }
          );

          match.winnerId = challengerSquad._id;
          break;

        case AdminResolution.SQUAD_B_WON:
          // Opponent ялсан
          await Squad.findByIdAndUpdate(
            opponentSquad._id,
            {
              $inc: {
                currentBountyCoins: match.bountyAmount * 2,
                "matchStats.wins": 1,
                "matchStats.totalMatches": 1,
                "matchStats.totalEarned": match.bountyAmount,
              },
              $setOnInsert: {
                "matchStats.winRate": 0,
              },
            },
            { session }
          );

          await Squad.findByIdAndUpdate(
            challengerSquad._id,
            {
              $inc: {
                "matchStats.losses": 1,
                "matchStats.totalMatches": 1,
                "matchStats.totalEarned": -match.bountyAmount,
              },
              $setOnInsert: {
                "matchStats.winRate": 0,
              },
            },
            { session }
          );

          match.winnerId = opponentSquad._id;
          break;

        case AdminResolution.DRAW:
        case AdminResolution.CANCELLED:
          // Coin буцаах
          await Squad.findByIdAndUpdate(
            challengerSquad._id,
            {
              $inc: { currentBountyCoins: match.bountyAmount },
            },
            { session }
          );

          await Squad.findByIdAndUpdate(
            opponentSquad._id,
            {
              $inc: { currentBountyCoins: match.bountyAmount },
            },
            { session }
          );

          if (resolution === AdminResolution.DRAW) {
            await Squad.findByIdAndUpdate(
              challengerSquad._id,
              {
                $inc: { "matchStats.draws": 1, "matchStats.totalMatches": 1 },
                $setOnInsert: {
                  "matchStats.winRate": 0,
                },
              },
              { session }
            );

            await Squad.findByIdAndUpdate(
              opponentSquad._id,
              {
                $inc: { "matchStats.draws": 1, "matchStats.totalMatches": 1 },
                $setOnInsert: {
                  "matchStats.winRate": 0,
                },
              },
              { session }
            );
          }
          break;
      }

      match.status = MatchStatus.COMPLETED;
      match.completedAt = new Date();
      await match.save({ session });

      // Win rate шинэчлэх
      await this.updateWinRates(
        challengerSquad._id,
        opponentSquad._id,
        session
      );

      await session.commitTransaction();

      // Notifications илгээх
      await this.sendResolutionNotifications(
        match,
        challengerSquad,
        opponentSquad,
        resolution
      );

      return match;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  private static async updateWinRates(
    squad1Id: any,
    squad2Id: any,
    session: any
  ) {
    for (const squadId of [squad1Id, squad2Id]) {
      const squad = await Squad.findById(squadId);
      if (squad) {
        // Safely calculate win rate
        squad.matchStats.winRate = calculateWinRate(
          squad.matchStats.wins,
          squad.matchStats.losses,
          squad.matchStats.draws
        );
        await squad.save({ session });
      }
    }
  }

  private static async sendResolutionNotifications(
    match: any,
    challengerSquad: any,
    opponentSquad: any,
    resolution: AdminResolution
  ) {
    let message = "";

    switch (resolution) {
      case AdminResolution.SQUAD_A_WON:
        message = `${challengerSquad.name} ялалт байлаа`;
        break;
      case AdminResolution.SQUAD_B_WON:
        message = `${opponentSquad.name} ялалт байлаа`;
        break;
      case AdminResolution.DRAW:
        message = "Тэнцсэн гэж тооцогдлоо";
        break;
      case AdminResolution.CANCELLED:
        message = "Match цуцлагдсан";
        break;
    }

    await Notification.create({
      userId: challengerSquad.leader,
      title: "Dispute шийдэгдлээ",
      content: message,
      type: "SYSTEM",
    });

    await Notification.create({
      userId: opponentSquad.leader,
      title: "Dispute шийдэгдлээ",
      content: message,
      type: "SYSTEM",
    });
  }
}
