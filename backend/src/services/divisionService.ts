import mongoose, { ClientSession } from "mongoose";
import Squad, { SquadDivision } from "../models/Squad";
import TournamentMatch from "../models/TournamentMatch";
import BountyCoin from "../models/BountyCoin";
import {
  canUpgradeDivision,
  getNextDivision,
  getPreviousDivision,
  shouldDemoteDivision,
  calculateBountyCoinsForMatch,
  processDivisionChange,
  useProtection,
  resetProtections,
  DIVISION_CONFIG,
} from "../utils/divisionSystem";

export class DivisionService {
  /**
   * Process match result and update squad divisions and bounty coins
   */
  static async processMatchResult(matchId: string, providedSession?: ClientSession): Promise<void> {
    if (!mongoose.isValidObjectId(matchId)) throw new Error("Invalid match ID");
    const apply = async (session: ClientSession): Promise<void> => {
        // A second concurrent processor must either see the completed flag or
        // conflict and retry. Awarding coins and setting the flag are atomic.
        const match = await TournamentMatch.findById(matchId).session(session);
        if (!match || !match.winner || !match.loser || match.status !== "completed") {
          throw new Error("Match not found or not completed");
        }
        if (match.divisionChangesProcessed) return;
        const [squad1, squad2] = await Promise.all([
          Squad.findById(match.squad1).session(session),
          Squad.findById(match.squad2).session(session),
        ]);
        if (!squad1 || !squad2) throw new Error("Squads not found");

        const firstId = squad1._id.toString();
        const secondId = squad2._id.toString();
        const winner = match.winner.toString(), loser = match.loser.toString();
        if (!((winner === firstId && loser === secondId) || (winner === secondId && loser === firstId))) {
          throw new Error("Invalid winning and losing squads");
        }

        match.squad1Division = squad1.division;
        match.squad2Division = squad2.division;
        const squad1IsWinner = winner === firstId;
        const squad2IsWinner = winner === secondId;
        const defaultWinnerAward = calculateBountyCoinsForMatch(squad1.division, true);
        const defaultLoserDeduction = Math.abs(calculateBountyCoinsForMatch(squad1.division, false));
        const winnerAward = Math.max(0, match.bountyCoinAmount ?? defaultWinnerAward);
        const loserDeduction = match.matchType === "normal" && match.applyLoserDeduction !== false
          ? defaultLoserDeduction : 0;
        const squad1BountyChange = squad1IsWinner ? winnerAward : -loserDeduction;
        const squad2BountyChange = squad2IsWinner ? winnerAward : -loserDeduction;

        match.squad1BountyChange = squad1BountyChange;
        match.squad2BountyChange = squad2BountyChange;
        // MongoDB transactions should be sequential on this same session.
        await this.updateSquadAfterMatch(squad1, squad1BountyChange, squad1IsWinner, session);
        await this.updateSquadAfterMatch(squad2, squad2BountyChange, squad2IsWinner, session);
        match.divisionChangesProcessed = true;
        match.bountyCoinsDistributed = true;
        await match.save({ session });

    };
    if (providedSession) {
      await apply(providedSession);
      return;
    }
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => apply(session));
    } finally {
      await session.endSession();
    }
  }

  /**
   * Update squad after match result
   */
  private static async updateSquadAfterMatch(
    squad: any,
    bountyChange: number,
    isWinner: boolean,
    session?: ClientSession
  ): Promise<void> {
    // Update consecutive losses
    if (isWinner) {
      squad.consecutiveLosses = 0;
      // Reset protections on win
      squad.protectionCount = resetProtections();
    } else {
      squad.consecutiveLosses += 1;
    }

    // Update bounty coins
    const newBountyCoins = Math.max(0, squad.currentBountyCoins + bountyChange);
    squad.currentBountyCoins = newBountyCoins;

    // Manual upgrades only: remove auto-upgrade on wins. Division upgrades now require explicit spend by leader.

    // Check for division demotion
    if (
      !isWinner &&
      shouldDemoteDivision(
        squad.division,
        newBountyCoins,
        squad.protectionCount,
        squad.consecutiveLosses
      )
    ) {
      await this.demoteSquadDivision(squad, session);
    }

    // Update total bounty coins
    if (bountyChange > 0) {
      squad.totalBountyCoinsEarned += bountyChange;
    } else if (bountyChange < 0) {
      squad.totalBountyCoinsSpent += Math.abs(bountyChange);
    }

    await squad.save({ session });
  }

  /**
   * Upgrade squad to next division
   */
  static async upgradeSquadDivision(squad: any): Promise<void> {
    const nextDivision = getNextDivision(squad.division);
    if (!nextDivision) {
      throw new Error("Cannot upgrade further");
    }

    const divisionChange = processDivisionChange(
      squad.division,
      squad.currentBountyCoins,
      true
    );

    squad.division = divisionChange.newDivision;
    // Deduct coins used for upgrade and carry over remaining coins
    squad.currentBountyCoins = divisionChange.newCoins;
    squad.totalBountyCoinsSpent =
      (squad.totalBountyCoinsSpent || 0) + divisionChange.coinsSpent;
    squad.consecutiveLosses = 0;
    squad.protectionCount = resetProtections();

    await squad.save();
  }

  /**
   * Demote squad to previous division
   */
  static async demoteSquadDivision(squad: any, session?: ClientSession): Promise<void> {
    const prevDivision = getPreviousDivision(squad.division);
    if (!prevDivision) {
      throw new Error("Cannot demote further");
    }

    const divisionChange = processDivisionChange(
      squad.division,
      squad.currentBountyCoins,
      false
    );

    squad.division = divisionChange.newDivision;
    squad.currentBountyCoins = divisionChange.newCoins;
    squad.consecutiveLosses = 0;
    squad.protectionCount = resetProtections();

    await squad.save({ session });
  }

  /**
   * Use protection for a squad
   */
  static async useProtection(squadId: string): Promise<void> {
    const squad = await Squad.findById(squadId);
    if (!squad) {
      throw new Error("Squad not found");
    }

    if (squad.protectionCount <= 0) {
      throw new Error("No protections remaining");
    }

    squad.protectionCount = useProtection(squad.protectionCount);
    await squad.save();
  }

  /**
   * Get division leaderboard
   */
  static async getDivisionLeaderboard(
    division: SquadDivision,
    limit: number = 50
  ) {
    return await Squad.find({ division })
      .sort({ currentBountyCoins: -1, totalBountyCoinsEarned: -1 })
      .limit(limit)
      .select("name tag currentBountyCoins totalBountyCoinsEarned level");
  }

  /**
   * Get squad division info
   */
  static async getSquadDivisionInfo(squadId: string) {
    const squad = await Squad.findById(squadId);
    if (!squad) {
      throw new Error("Squad not found");
    }

    const divisionConfig = DIVISION_CONFIG[squad.division];
    const nextDivision = getNextDivision(squad.division);
    const canUpgrade = canUpgradeDivision(
      squad.division,
      squad.currentBountyCoins
    );

    return {
      currentDivision: squad.division,
      currentBountyCoins: squad.currentBountyCoins,
      divisionConfig,
      nextDivision,
      canUpgrade,
      protectionCount: squad.protectionCount,
      consecutiveLosses: squad.consecutiveLosses,
      progress: nextDivision
        ? (squad.currentBountyCoins / divisionConfig.upgradeCost) * 100
        : 100,
    };
  }

  /**
   * Purchase bounty coins
   */
  static async purchaseBountyCoins(
    squadId: string,
    amount: number
  ): Promise<{ success: boolean; message: string; newBalance: number }> {
    const squad = await Squad.findById(squadId);
    if (!squad) {
      throw new Error("Squad not found");
    }

    const divisionConfig = DIVISION_CONFIG[squad.division];
    const costPer50 = divisionConfig.bountyCoinPrice;
    const totalCost = (amount / 50) * costPer50;

    // Here you would integrate with payment system
    // For now, we'll just update the bounty coins
    squad.currentBountyCoins += amount;
    squad.totalBountyCoinsEarned += amount;

    await squad.save();

    return {
      success: true,
      message: `Successfully purchased ${amount} bounty coins for ${totalCost} MNT`,
      newBalance: squad.currentBountyCoins,
    };
  }
}
