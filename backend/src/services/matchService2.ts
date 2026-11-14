import Match, {
  MatchStatus,
  MatchResult,
  AdminResolution,
} from "../models/Match";
import Squad from "../models/Squad";
import Notification from "../models/Notification";
import MatchChat from "../models/MatchChat";
import mongoose from "mongoose";

// Utility function to safely calculate win rate
function calculateWinRate(wins: number, losses: number, draws: number = 0): number {
  const totalMatches = wins + losses + draws;
  if (totalMatches === 0 || isNaN(wins) || isNaN(losses) || isNaN(draws)) {
    return 0;
  }
  return Math.round((wins / totalMatches) * 100);
}

export class MatchService2 {
  // Тоглолт эхэлсэн гэж батлах
  static async startMatch(matchId: string, userId: string) {
    console.log(`🚀 Start match called: matchId=${matchId}, userId=${userId}`);
    
    const match = await Match.findById(matchId)
      .populate("challengerSquadId")
      .populate("opponentSquadId");

    if (!match) {
      throw new Error("Match олдсонгүй");
    }

    console.log(`📊 Current match status: ${match.status}`);
    console.log(`📊 Current challengerReady: ${match.challengerReady}`);
    console.log(`📊 Current opponentReady: ${match.opponentReady}`);

    if (match.status !== MatchStatus.ACCEPTED) {
      throw new Error("Match accepted байхгүй байна");
    }

    // Leader эрх шалгах
    const challengerSquad: any = match.challengerSquadId;
    const opponentSquad: any = match.opponentSquadId;

    const isChallenger = challengerSquad.leader.toString() === userId;
    const isOpponent = opponentSquad.leader.toString() === userId;

    console.log(`👤 User is challenger: ${isChallenger}, is opponent: ${isOpponent}`);

    if (!isChallenger && !isOpponent) {
      throw new Error("Зөвхөн leader тоглолт эхлүүлэх эрхтэй");
    }

    // Mark the current squad as ready
    if (isChallenger) {
      match.challengerReady = true;
      console.log(`✅ Marked challenger as ready`);
    } else if (isOpponent) {
      match.opponentReady = true;
      console.log(`✅ Marked opponent as ready`);
    }

    // Check if both sides are ready
    const bothReady = match.challengerReady && match.opponentReady;
    console.log(`🔍 Both ready check: challengerReady=${match.challengerReady}, opponentReady=${match.opponentReady}, bothReady=${bothReady}`);
    
    if (bothReady) {
      // Both sides confirmed - start the match
      console.log(`🎮 Both squads ready - starting match!`);
      match.status = MatchStatus.PLAYING;
      match.startedAt = new Date();
      // 15 минутын deadline
      match.resultDeadline = new Date(Date.now() + 15 * 60 * 1000);
      
      // Send notification to both leaders
      await Notification.create({
        userId: challengerSquad.leader,
        title: "Тоглолт эхэлсэн",
        content: "Тоглолт эхэлсэн байна",
        type: "SYSTEM",
      });
      
      await Notification.create({
        userId: opponentSquad.leader,
        title: "Тоглолт эхэлсэн",
        content: "Тоглолт эхэлсэн байна",
        type: "SYSTEM",
      });
    } else {
      // Only one side confirmed - send notification to the other side
      console.log(`⏳ Only one side ready - waiting for the other side`);
      const otherLeaderId = isChallenger
        ? opponentSquad.leader
        : challengerSquad.leader;
      
      await Notification.create({
        userId: otherLeaderId,
        title: "Тоглолт эхлүүлэх хүсэлт",
        content: "Нөгөө баг тоглолт эхлүүлэхэд бэлэн байна. Та бэлэн болоход тоглолт эхлэх болно.",
        type: "SYSTEM",
      });
    }

    await match.save();
    console.log(`💾 Match saved with status: ${match.status}`);
    return match;
  }

  // Үр дүн оруулах
  static async submitResult(
    matchId: string,
    userId: string,
    result: MatchResult
  ) {
    const match = await Match.findById(matchId)
      .populate("challengerSquadId")
      .populate("opponentSquadId");

    if (!match) {
      throw new Error("Match олдсонгүй");
    }

    if (
      match.status !== MatchStatus.PLAYING &&
      match.status !== MatchStatus.RESULT_SUBMITTED
    ) {
      if (match.status === MatchStatus.COMPLETED) {
        throw new Error("Тоглолт аль хэдийн дууссан байна");
      } else if (match.status === MatchStatus.CANCELLED) {
        throw new Error("Тоглолт цуцлагдсан байна");
      } else if (match.status === MatchStatus.DISPUTED) {
        throw new Error("Тоглолт dispute-д байна");
      } else {
        throw new Error(`Тоглолт ${match.status} статустай байна. Үр дүн оруулах боломжгүй.`);
      }
    }

    // Leader эрх шалгах
    const challengerSquad: any = match.challengerSquadId;
    const opponentSquad: any = match.opponentSquadId;

    const isChallenger = challengerSquad.leader.toString() === userId;
    const isOpponent = opponentSquad.leader.toString() === userId;

    if (!isChallenger && !isOpponent) {
      throw new Error("Зөвхөн leader үр дүн оруулах эрхтэй");
    }

    // Үр дүн оруулах - одоо 2 тал тус бүр өөрийн үр дүнг оруулж болно
    if (isChallenger) {
      match.challengerResult = result;
    } else {
      match.opponentResult = result;
    }

    // 2 тал үр дүн оруулсан эсэхийг шалгах
    if (match.challengerResult && match.opponentResult) {
      // Үр дүн таарч байгаа эсэхийг шалгах (өөр өөр үр дүн байх ёстой)
      const resultsMatch =
        (match.challengerResult === MatchResult.WIN &&
          match.opponentResult === MatchResult.LOSS) ||
        (match.challengerResult === MatchResult.LOSS &&
          match.opponentResult === MatchResult.WIN);

      if (resultsMatch) {
        // Үр дүн таарсан - match дуусгах
        return await this.completeMatch(match);
      } else {
        // Үр дүн ижил байвал dispute руу шилжинэ (2 тал WIN эсвэл 2 тал LOSS)
        match.status = MatchStatus.DISPUTED;
        match.disputeReason = "Үр дүн ижил байна - dispute шаардлагатай";
      }
    } else {
      match.status = MatchStatus.RESULT_SUBMITTED;
    }

    await match.save();

    // Notification илгээх
    const otherLeaderId = isChallenger
      ? opponentSquad.leader
      : challengerSquad.leader;
    await Notification.create({
      userId: otherLeaderId,
      title: "Үр дүн оруулсан",
      content: "Нөгөө баг үр дүнгээ оруулсан байна",
      type: "SYSTEM",
    });

    return match;
  }

  // Match дуусгах (coin шилжүүлэх)
  static async completeMatch(match: any) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Determine winner based on both results
      let winnerId, loserId;
      
      if (match.challengerResult === MatchResult.WIN && match.opponentResult === MatchResult.LOSS) {
        // Challenger won, opponent lost
        winnerId = match.challengerSquadId._id;
        loserId = match.opponentSquadId._id;
      } else if (match.challengerResult === MatchResult.LOSS && match.opponentResult === MatchResult.WIN) {
        // Opponent won, challenger lost
        winnerId = match.opponentSquadId._id;
        loserId = match.challengerSquadId._id;
      } else if (match.challengerResult === MatchResult.WIN && !match.opponentResult) {
        // Only challenger submitted result (WIN)
        winnerId = match.challengerSquadId._id;
        loserId = match.opponentSquadId._id;
      } else if (match.opponentResult === MatchResult.WIN && !match.challengerResult) {
        // Only opponent submitted result (WIN)
        winnerId = match.opponentSquadId._id;
        loserId = match.challengerSquadId._id;
      } else {
        // Handle edge cases - if both submitted same result or other conflicts
        // Default to challenger result if available, otherwise opponent result
        if (match.challengerResult === MatchResult.WIN) {
          winnerId = match.challengerSquadId._id;
          loserId = match.opponentSquadId._id;
        } else if (match.opponentResult === MatchResult.WIN) {
          winnerId = match.opponentSquadId._id;
          loserId = match.challengerSquadId._id;
        } else {
          throw new Error("Cannot determine winner from match results");
        }
      }

      // Ялагчид coin өгөх (2x bounty)
      await Squad.findByIdAndUpdate(
        winnerId,
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

      // Хожигдогчийн stats шинэчлэх
      await Squad.findByIdAndUpdate(
        loserId,
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

      // Win rate шинэчлэх
      const winnerSquad = await Squad.findById(winnerId);
      const loserSquad = await Squad.findById(loserId);

      if (winnerSquad) {
        // Safely calculate win rate
        winnerSquad.matchStats.winRate = calculateWinRate(
          winnerSquad.matchStats.wins,
          winnerSquad.matchStats.losses,
          winnerSquad.matchStats.draws
        );
        await winnerSquad.save({ session });
      }

      if (loserSquad) {
        // Safely calculate win rate
        loserSquad.matchStats.winRate = calculateWinRate(
          loserSquad.matchStats.wins,
          loserSquad.matchStats.losses,
          loserSquad.matchStats.draws
        );
        await loserSquad.save({ session });
      }

      match.status = MatchStatus.COMPLETED;
      match.winnerId = winnerId;
      match.completedAt = new Date();
      await match.save({ session });

      await session.commitTransaction();

      return match;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
