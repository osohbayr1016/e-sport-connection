import mongoose from "mongoose";
import Achievement, { IAchievement, AchievementCategory, AchievementType } from "../models/Achievement";
import UserAchievement, { IUserAchievement, UserAchievementStatus } from "../models/UserAchievement";
import UserBadge, { IUserBadge } from "../models/UserBadge";
import Badge, { IBadge } from "../models/Badge";
import LeaderboardEntry, { ILeaderboardEntry, LeaderboardType, LeaderboardPeriod } from "../models/LeaderboardEntry";
import User from "../models/User";
import PlayerProfile from "../models/PlayerProfile";
import TournamentMatch from "../models/TournamentMatch";
import Tournament from "../models/Tournament";

export interface AchievementTrigger {
  userId: mongoose.Types.ObjectId;
  type: string;
  data: {
    game?: string;
    rank?: string;
    tournamentId?: mongoose.Types.ObjectId;
    matchId?: mongoose.Types.ObjectId;
    score?: number;
    [key: string]: any;
  };
}

export interface AchievementProgress {
  achievementId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  currentProgress: number;
  targetProgress: number;
  isCompleted: boolean;
}

export class AchievementService {
  /**
   * Process achievement triggers and update progress
   */
  static async processAchievementTrigger(trigger: AchievementTrigger): Promise<void> {
    try {
      const { userId, type, data } = trigger;

      // Get all active achievements that match the trigger type
      const achievements = await this.getRelevantAchievements(type, data);

      for (const achievement of achievements) {
        await this.updateAchievementProgress(userId, achievement, data);
      }

      // Update leaderboards
      await this.updateLeaderboards(userId);
    } catch (error) {
      console.error("Error processing achievement trigger:", error);
    }
  }

  /**
   * Get achievements relevant to a trigger type
   */
  private static async getRelevantAchievements(type: string, data: any): Promise<IAchievement[]> {
    const query: any = { isActive: true };

    // Filter by category based on trigger type
    switch (type) {
      case "match_win":
      case "match_loss":
        query.category = AchievementCategory.MATCH;
        break;
      case "tournament_win":
      case "tournament_participation":
        query.category = AchievementCategory.TOURNAMENT;
        break;
      case "profile_update":
      case "rank_up":
        query.category = AchievementCategory.PROGRESS;
        break;
      case "social_action":
        query.category = AchievementCategory.SOCIAL;
        break;
    }

    // Filter by game if specified
    if (data.game) {
      query["requirements.game"] = data.game;
    }

    return await Achievement.find(query);
  }

  /**
   * Update progress for a specific achievement
   */
  private static async updateAchievementProgress(
    userId: mongoose.Types.ObjectId,
    achievement: IAchievement,
    data: any
  ): Promise<void> {
    try {
      // Check if user already has this achievement
      let userAchievement = await UserAchievement.findOne({
        userId,
        achievementId: achievement._id,
      });

      if (!userAchievement) {
        // Create new user achievement
        userAchievement = new UserAchievement({
          userId,
          achievementId: achievement._id,
          status: UserAchievementStatus.IN_PROGRESS,
          progress: {
            current: 0,
            target: achievement.requirements.counter || 1,
            percentage: 0,
          },
        });
      }

      // Skip if already completed
      if (userAchievement.status === UserAchievementStatus.COMPLETED) {
        return;
      }

      // Update progress based on achievement type
      const progressUpdate = await this.calculateProgressUpdate(achievement, data);
      
      if (progressUpdate > 0) {
        userAchievement.progress.current += progressUpdate;
        userAchievement.progress.percentage = Math.min(
          (userAchievement.progress.current / userAchievement.progress.target) * 100,
          100
        );

        // Check if achievement is completed
        if (userAchievement.progress.current >= userAchievement.progress.target) {
          userAchievement.status = UserAchievementStatus.COMPLETED;
          userAchievement.completedAt = new Date();
          
          // Award rewards
          await this.awardAchievementRewards(userId, achievement, userAchievement);
        }

        await userAchievement.save();
      }
    } catch (error) {
      console.error("Error updating achievement progress:", error);
    }
  }

  /**
   * Calculate progress update based on achievement type and trigger data
   */
  private static async calculateProgressUpdate(achievement: IAchievement, data: any): Promise<number> {
    switch (achievement.type) {
      case AchievementType.COUNTER:
        return this.calculateCounterProgress(achievement, data);
      
      case AchievementType.MILESTONE:
        return await this.calculateMilestoneProgress(achievement, data);
      
      case AchievementType.CONDITIONAL:
        return await this.calculateConditionalProgress(achievement, data);
      
      case AchievementType.TIME_BASED:
        return await this.calculateTimeBasedProgress(achievement, data);
      
      default:
        return 0;
    }
  }

  /**
   * Calculate progress for counter-based achievements
   */
  private static calculateCounterProgress(achievement: IAchievement, data: any): number {
    // For counter-based achievements, we increment by 1 for each trigger
    // The specific logic depends on the achievement category and requirements
    
    switch (achievement.category) {
      case AchievementCategory.TOURNAMENT:
        if (achievement.name === "First Tournament" || achievement.name === "Tournament Veteran") {
          return 1; // Each tournament participation counts as 1
        }
        if (achievement.name === "Tournament Champion") {
          // This should only be triggered when a tournament is won
          return data.tournamentWon ? 1 : 0;
        }
        return 1;
        
      case AchievementCategory.MATCH:
        if (achievement.name === "First Victory" || achievement.name === "Match Winner" || achievement.name === "Match Master") {
          return data.matchWon ? 1 : 0; // Only count wins
        }
        return 1;
        
      case AchievementCategory.PROGRESS:
        if (achievement.name === "Profile Creator") {
          return 1; // Profile creation counts as 1
        }
        return 1;
        
      case AchievementCategory.SOCIAL:
        if (achievement.name === "Team Player" || achievement.name === "Squad Leader") {
          return 1; // Squad actions count as 1
        }
        return 1;
        
      case AchievementCategory.SPECIAL:
        if (achievement.name === "Early Bird") {
          return 1; // Early user counts as 1
        }
        return 1;
        
      default:
        return 1; // Default increment
    }
  }

  /**
   * Calculate progress for milestone-based achievements
   */
  private static async calculateMilestoneProgress(achievement: IAchievement, data: any): Promise<number> {
    // Check if user has reached the required milestone
    if (achievement.requirements.rank && data.rank === achievement.requirements.rank) {
      return 1; // Milestone reached
    }
    
    // Check if user has reached the required milestone
    if (achievement.requirements.milestone && data.milestone === achievement.requirements.milestone) {
      return 1; // Milestone reached
    }
    
    return 0; // Milestone not reached
  }

  /**
   * Calculate progress for conditional achievements
   */
  private static async calculateConditionalProgress(achievement: IAchievement, data: any): Promise<number> {
    // Implement conditional logic based on achievement requirements
    // For example, win streaks, specific game conditions, etc.
    
    if (achievement.requirements.condition) {
      // Parse the condition and check if it's met
      const condition = achievement.requirements.condition.toLowerCase();
      
      if (condition.includes("win streak") && data.winStreak) {
        const requiredStreak = parseInt(condition.match(/\d+/)?.[0] || "0");
        return data.winStreak >= requiredStreak ? 1 : 0;
      }
      
      if (condition.includes("perfect match") && data.perfectMatch) {
        return 1;
      }
      
      if (condition.includes("comeback") && data.comebackWin) {
        return 1;
      }
    }
    
    return 0; // Condition not met
  }

  /**
   * Calculate progress for time-based achievements
   */
  private static async calculateTimeBasedProgress(achievement: IAchievement, data: any): Promise<number> {
    // Implement time-based logic
    // For example, daily login streaks, consecutive days played, etc.
    
    if (achievement.requirements.timeFrame && data.daysActive) {
      const requiredDays = achievement.requirements.timeFrame;
      return data.daysActive >= requiredDays ? 1 : 0;
    }
    
    if (data.dailyLogin) {
      return 1; // Daily login counts as progress
    }
    
    return 0; // Time requirement not met
  }

  /**
   * Award rewards for completed achievement
   */
  private static async awardAchievementRewards(
    userId: mongoose.Types.ObjectId,
    achievement: IAchievement,
    userAchievement: IUserAchievement
  ): Promise<void> {
    try {
      const rewards = achievement.rewards;

      // Award bounty coins
      if (rewards.bountyCoins && rewards.bountyCoins > 0) {
        await this.awardBountyCoins(userId, rewards.bountyCoins);
        userAchievement.rewardsClaimed.bountyCoins = true;
      }

      // Award experience
      if (rewards.experience && rewards.experience > 0) {
        await this.awardExperience(userId, rewards.experience);
        userAchievement.rewardsClaimed.experience = true;
      }

      // Award badge
      if (rewards.badge && mongoose.Types.ObjectId.isValid(rewards.badge)) {
        await this.awardBadge(userId, new mongoose.Types.ObjectId(rewards.badge as unknown as string), new mongoose.Types.ObjectId(achievement._id.toString()));
        userAchievement.rewardsClaimed.badge = true;
      }

      // Award title
      if (rewards.title) {
        await this.awardTitle(userId, rewards.title);
        userAchievement.rewardsClaimed.title = true;
      }

      await userAchievement.save();
    } catch (error) {
      console.error("Error awarding achievement rewards:", error);
    }
  }

  /**
   * Award bounty coins to user
   */
  private static async awardBountyCoins(userId: mongoose.Types.ObjectId, amount: number): Promise<void> {
    // This would integrate with your existing bounty coin system
    console.log(`Awarding ${amount} bounty coins to user ${userId}`);
  }

  /**
   * Award experience to user
   */
  private static async awardExperience(userId: mongoose.Types.ObjectId, amount: number): Promise<void> {
    // This would integrate with your existing experience/level system
    console.log(`Awarding ${amount} experience to user ${userId}`);
  }

  /**
   * Award badge to user
   */
  private static async awardBadge(
    userId: mongoose.Types.ObjectId,
    badgeId: mongoose.Types.ObjectId,
    achievementId: mongoose.Types.ObjectId
  ): Promise<void> {
    try {
      const existingBadge = await UserBadge.findOne({ userId, badgeId });
      
      if (!existingBadge) {
        const userBadge = new UserBadge({
          userId,
          badgeId,
          earnedAt: new Date(),
          metadata: {
            achievementId,
          },
        });
        
        await userBadge.save();
      }
    } catch (error) {
      console.error("Error awarding badge:", error);
    }
  }

  /**
   * Award title to user
   */
  private static async awardTitle(userId: mongoose.Types.ObjectId, title: string): Promise<void> {
    // This would integrate with your user profile system
    console.log(`Awarding title "${title}" to user ${userId}`);
  }

  /**
   * Get user's achievements
   */
  static async getUserAchievements(userId: mongoose.Types.ObjectId): Promise<IUserAchievement[]> {
    return await UserAchievement.find({ userId })
      .populate("achievementId")
      .sort({ createdAt: -1 });
  }

  /**
   * Get user's badges
   */
  static async getUserBadges(userId: mongoose.Types.ObjectId): Promise<IUserBadge[]> {
    return await UserBadge.find({ userId })
      .populate("badgeId")
      .sort({ earnedAt: -1 });
  }

  /**
   * Get leaderboard entries
   */
  static async getLeaderboard(
    type: LeaderboardType,
    period: LeaderboardPeriod,
    limit: number = 50
  ): Promise<ILeaderboardEntry[]> {
    return await LeaderboardEntry.find({ leaderboardType: type, period })
      .populate("userId", "name avatar")
      .sort({ rank: 1 })
      .limit(limit);
  }

  /**
   * Update leaderboards for a user
   */
  private static async updateLeaderboards(userId: mongoose.Types.ObjectId): Promise<void> {
    try {
      // Calculate achievement points
      const achievementPoints = await this.calculateAchievementPoints(userId);
      await this.updateLeaderboardEntry(userId, LeaderboardType.ACHIEVEMENT_POINTS, achievementPoints);

      // Calculate tournament wins
      const tournamentWins = await this.calculateTournamentWins(userId);
      await this.updateLeaderboardEntry(userId, LeaderboardType.TOURNAMENT_WINS, tournamentWins);

      // Calculate match wins
      const matchWins = await this.calculateMatchWins(userId);
      await this.updateLeaderboardEntry(userId, LeaderboardType.MATCH_WINS, matchWins);

    } catch (error) {
      console.error("Error updating leaderboards:", error);
    }
  }

  /**
   * Update a specific leaderboard entry
   */
  private static async updateLeaderboardEntry(
    userId: mongoose.Types.ObjectId,
    type: LeaderboardType,
    score: number
  ): Promise<void> {
    const periods = [LeaderboardPeriod.DAILY, LeaderboardPeriod.WEEKLY, LeaderboardPeriod.MONTHLY, LeaderboardPeriod.ALL_TIME];

    for (const period of periods) {
      await LeaderboardEntry.findOneAndUpdate(
        { userId, leaderboardType: type, period },
        { 
          score,
          lastUpdated: new Date(),
        },
        { upsert: true, new: true }
      );
    }

    // Recalculate ranks for this leaderboard type and period
    await this.recalculateRanks(type, LeaderboardPeriod.ALL_TIME);
  }

  /**
   * Recalculate ranks for a leaderboard
   */
  private static async recalculateRanks(type: LeaderboardType, period: LeaderboardPeriod): Promise<void> {
    const entries = await LeaderboardEntry.find({ leaderboardType: type, period })
      .sort({ score: -1 });

    for (let i = 0; i < entries.length; i++) {
      entries[i].rank = i + 1;
      await entries[i].save();
    }
  }

  /**
   * Calculate user's total achievement points
   */
  private static async calculateAchievementPoints(userId: mongoose.Types.ObjectId): Promise<number> {
    const completedAchievements = await UserAchievement.find({
      userId,
      status: UserAchievementStatus.COMPLETED,
    }).populate("achievementId");

    return completedAchievements.reduce((total, userAchievement) => {
      const achievement = userAchievement.achievementId as unknown as IAchievement;
      return total + (achievement?.points || 0);
    }, 0);
  }

  /**
   * Calculate user's tournament wins
   */
  private static async calculateTournamentWins(userId: mongoose.Types.ObjectId): Promise<number> {
    // This would integrate with your tournament system
    // For now, return 0 as placeholder
    return 0;
  }

  /**
   * Calculate user's match wins
   */
  private static async calculateMatchWins(userId: mongoose.Types.ObjectId): Promise<number> {
    // This would integrate with your match system
    // For now, return 0 as placeholder
    return 0;
  }

  /**
   * Create sample achievements
   */
  static async createSampleAchievements(): Promise<void> {
    const sampleAchievements = [
      {
        name: "First Victory",
        description: "Win your first match",
        category: AchievementCategory.MATCH,
        rarity: "COMMON",
        type: AchievementType.COUNTER,
        icon: "trophy",
        points: 10,
        requirements: { counter: 1 },
        rewards: { bountyCoins: 50, experience: 100 },
      },
      {
        name: "Tournament Champion",
        description: "Win 5 tournaments",
        category: AchievementCategory.TOURNAMENT,
        rarity: "LEGENDARY",
        type: AchievementType.COUNTER,
        icon: "crown",
        points: 500,
        requirements: { counter: 5 },
        rewards: { bountyCoins: 1000, experience: 2000 },
      },
      {
        name: "Rising Star",
        description: "Reach Epic rank",
        category: AchievementCategory.PROGRESS,
        rarity: "RARE",
        type: AchievementType.MILESTONE,
        icon: "star",
        points: 100,
        requirements: { rank: "Epic" },
        rewards: { bountyCoins: 200, experience: 500 },
      },
    ];

    for (const achievementData of sampleAchievements) {
      const existingAchievement = await Achievement.findOne({ name: achievementData.name });
      if (!existingAchievement) {
        const achievement = new Achievement(achievementData);
        await achievement.save();
      }
    }
  }
}
