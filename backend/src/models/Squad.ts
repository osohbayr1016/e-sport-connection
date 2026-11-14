import mongoose, { Document, Schema } from "mongoose";

export enum SquadJoinType {
  INVITE_ONLY = "INVITE_ONLY",
  OPEN_FOR_APPLY = "OPEN_FOR_APPLY",
  EVERYONE_CAN_JOIN = "EVERYONE_CAN_JOIN",
}

export enum SquadDivision {
  SILVER = "SILVER",
  GOLD = "GOLD",
  DIAMOND = "DIAMOND",
}

export interface ISquad extends Document {
  name: string;
  tag: string;
  leader: mongoose.Types.ObjectId; // User ID of the squad leader
  members: mongoose.Types.ObjectId[]; // Array of User IDs
  maxMembers: number; // Default 7, can be 5-7
  game: "Mobile Legends: Bang Bang"; // Fixed to Mobile Legends only
  description?: string;
  logo?: string; // Squad logo/banner
  isActive: boolean;
  joinType: SquadJoinType; // New field for join settings
  level: number; // Squad level (1-100)
  experience: number; // Experience points for leveling up
  totalBountyCoinsEarned: number; // Total bounty coins earned by the squad
  totalBountyCoinsSpent: number; // Total bounty coins spent by the squad

  // Division System
  division: SquadDivision; // Current division
  currentBountyCoins: number; // Current bounty coins in current division
  protectionCount: number; // Number of protections remaining (0-2)
  consecutiveLosses: number; // Consecutive losses for division demotion

  // Match Statistics
  matchStats: {
    wins: number;
    losses: number;
    draws: number;
    totalMatches: number;
    winRate: number;
    totalEarned: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

const squadSchema = new Schema<ISquad>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    tag: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10,
      uppercase: true,
    },
    leader: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    maxMembers: {
      type: Number,
      required: true,
      min: 5,
      max: 7,
      default: 7,
    },
    game: {
      type: String,
      required: true,
      trim: true,
      default: "Mobile Legends: Bang Bang",
      enum: ["Mobile Legends: Bang Bang"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    logo: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    joinType: {
      type: String,
      enum: Object.values(SquadJoinType),
      default: SquadJoinType.OPEN_FOR_APPLY,
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
      max: 100,
    },
    experience: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalBountyCoinsEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalBountyCoinsSpent: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Division System
    division: {
      type: String,
      enum: Object.values(SquadDivision),
      default: SquadDivision.SILVER,
    },
    currentBountyCoins: {
      type: Number,
      default: 0,
      min: 0,
    },
    protectionCount: {
      type: Number,
      default: 2,
      min: 0,
      max: 2,
    },
    consecutiveLosses: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Match Statistics
    matchStats: {
      wins: {
        type: Number,
        default: 0,
        min: 0,
      },
      losses: {
        type: Number,
        default: 0,
        min: 0,
      },
      draws: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalMatches: {
        type: Number,
        default: 0,
        min: 0,
      },
      winRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      totalEarned: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
squadSchema.index({ leader: 1 });
squadSchema.index({ game: 1 });
squadSchema.index({ tag: 1 }, { unique: true });
squadSchema.index({ isActive: 1 });
squadSchema.index({ name: "text", description: "text" });
squadSchema.index({ division: 1 });
squadSchema.index({ currentBountyCoins: 1 });

// Validation: Ensure leader is in members array
squadSchema.pre("save", function (next) {
  // ObjectIds loaded independently can represent the same account without
  // having object identity. Normalize and deduplicate by their string value.
  const seen = new Set<string>();
  this.members = this.members.filter((member) => {
    const id = member.toString();
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  if (this.leader && !seen.has(this.leader.toString())) {
    this.members.push(this.leader);
  }

  // Ensure members array doesn't exceed maxMembers
  if (this.members.length > this.maxMembers) {
    return next(
      new Error(`Squad cannot have more than ${this.maxMembers} members`)
    );
  }

  // Initialize matchStats if not present (backwards compatibility)
  if (!this.matchStats) {
    this.matchStats = {
      wins: 0,
      losses: 0,
      draws: 0,
      totalMatches: 0,
      winRate: 0,
      totalEarned: 0,
    };
  }

  // Ensure winRate is not NaN
  if (this.matchStats && (isNaN(this.matchStats.winRate) || this.matchStats.winRate === null || this.matchStats.winRate === undefined)) {
    const totalMatches = this.matchStats.wins + this.matchStats.losses + this.matchStats.draws;
    if (totalMatches > 0) {
      this.matchStats.winRate = Math.round((this.matchStats.wins / totalMatches) * 100);
    } else {
      this.matchStats.winRate = 0;
    }
  }

  next();
});

export default mongoose.model<ISquad>("Squad", squadSchema);
