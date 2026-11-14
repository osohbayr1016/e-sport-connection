import Match, { MatchStatus } from "../models/Match";
import Squad from "../models/Squad";
import MatchChat from "../models/MatchChat";
import Notification from "../models/Notification";
import mongoose from "mongoose";

export class MatchService4 {
  // Match цуцлах
  static async cancelMatch(matchId: string, userId: string) {
    const match = await Match.findById(matchId)
      .populate("challengerSquadId")
      .populate("opponentSquadId");

    if (!match) {
      throw new Error("Match олдсонгүй");
    }

    if (
      match.status === MatchStatus.COMPLETED ||
      match.status === MatchStatus.CANCELLED
    ) {
      throw new Error("Дууссан match-ийг цуцлах боломжгүй");
    }

    // Leader эрх шалгах
    const challengerSquad: any = match.challengerSquadId;
    const opponentSquad: any = match.opponentSquadId;

    const isChallenger = challengerSquad.leader.toString() === userId;
    const isOpponent =
      opponentSquad && opponentSquad.leader.toString() === userId;

    if (!isChallenger && !isOpponent) {
      throw new Error("Зөвхөн leader цуцлах эрхтэй");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (match.status === MatchStatus.PENDING) {
        // Accept хийгдээгүй - зүгээр цуцлана
        if (match.coinsLocked) {
          await Squad.findByIdAndUpdate(
            challengerSquad._id,
            {
              $inc: { currentBountyCoins: match.bountyAmount },
            },
            { session }
          );
        }
      } else if (
        match.status === MatchStatus.ACCEPTED ||
        match.status === MatchStatus.PLAYING
      ) {
        // Accept хийгдсэн - цуцалсан тал coin алдана
        if (isChallenger) {
          // Challenger цуцалсан - opponent coin авна
          await Squad.findByIdAndUpdate(
            opponentSquad._id,
            {
              $inc: { currentBountyCoins: match.bountyAmount * 2 },
            },
            { session }
          );

          await Notification.create({
            userId: opponentSquad.leader,
            title: "Match цуцлагдлаа",
            content: `${challengerSquad.name} match-ийг цуцалсан тул та ${
              match.bountyAmount * 2
            } coin авлаа`,
            type: "SYSTEM",
          });
        } else {
          // Opponent цуцалсан - challenger coin авна
          await Squad.findByIdAndUpdate(
            challengerSquad._id,
            {
              $inc: { currentBountyCoins: match.bountyAmount * 2 },
            },
            { session }
          );

          await Notification.create({
            userId: challengerSquad.leader,
            title: "Match цуцлагдлаа",
            content: `${opponentSquad.name} match-ийг цуцалсан тул та ${
              match.bountyAmount * 2
            } coin авлаа`,
            type: "SYSTEM",
          });
        }
      }

      match.status = MatchStatus.CANCELLED;
      match.completedAt = new Date();
      await match.save({ session });

      // Chat устгах
      await MatchChat.deleteMany({ matchId: match._id }, { session });

      await session.commitTransaction();

      return match;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Chat мессеж илгээх
  static async sendChatMessage(
    matchId: string,
    userId: string,
    message: string
  ) {
    const match = await Match.findById(matchId)
      .populate("challengerSquadId")
      .populate("opponentSquadId");

    if (!match) {
      throw new Error("Match олдсонгүй");
    }

    if (
      match.status !== MatchStatus.ACCEPTED &&
      match.status !== MatchStatus.PLAYING
    ) {
      throw new Error("Chat эрх байхгүй");
    }

    // User match-д оролцож байгаа эсэхийг шалгах
    const challengerSquad: any = match.challengerSquadId;
    const opponentSquad: any = match.opponentSquadId;

    const isMember =
      challengerSquad.members.some((m: any) => m.toString() === userId) ||
      opponentSquad.members.some((m: any) => m.toString() === userId);

    if (!isMember) {
      throw new Error("Та энэ match-д оролцохгүй байна");
    }

    const chatMessage = await MatchChat.create({
      matchId: match._id,
      senderId: userId,
      message: message.trim(),
    });

    return chatMessage;
  }

  // Chat харах
  static async getChatMessages(matchId: string, userId: string) {
    const match = await Match.findById(matchId)
      .populate("challengerSquadId")
      .populate("opponentSquadId");

    if (!match) {
      throw new Error("Match олдсонгүй");
    }

    // User match-д оролцож байгаа эсэхийг шалгах
    const challengerSquad: any = match.challengerSquadId;
    const opponentSquad: any = match.opponentSquadId;

    const isMember =
      challengerSquad.members.some((m: any) => m.toString() === userId) ||
      (opponentSquad &&
        opponentSquad.members.some((m: any) => m.toString() === userId));

    if (!isMember) {
      throw new Error("Та энэ match-д оролцохгүй байна");
    }

    const messages = await MatchChat.find({ matchId })
      .populate("senderId", "name avatar")
      .sort({ createdAt: 1 });

    return messages;
  }

  // Match completed болоход chat устгах
  static async deleteChatOnComplete(matchId: string) {
    await MatchChat.deleteMany({ matchId });
  }
}
