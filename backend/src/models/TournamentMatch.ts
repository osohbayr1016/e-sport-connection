import mongoose, { Document, Schema } from "mongoose";
import { SquadDivision } from "./Squad";

export interface ITournamentMatch extends Document {
  tournament: mongoose.Types.ObjectId; // Tournament ID
  matchNumber: number; // Sequential match number
  round: number; // Tournament round (1, 2, 3, etc.)
  squad1: mongoose.Types.ObjectId; // Squad ID
  squad2?: mongoose.Types.ObjectId | null; // Absent for automatic BYEs
  winner?: mongoose.Types.ObjectId; // Squad ID of winner
  loser?: mongoose.Types.ObjectId; // Squad ID of loser
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  scheduledTime?: Date; // When the match is scheduled
  startTime?: Date; // When the match actually started
  endTime?: Date; // When the match ended
  score?: {
    squad1Score: number;
    squad2Score: number;
  };
  adminNotes?: string; // Admin notes about the match
  isWalkover: boolean; // If one team didn't show up
  walkoverReason?: string; // Reason for walkover
  bountyCoinsDistributed: boolean; // Whether bounty coins have been distributed
  bountyCoinAmount: number; // Amount of bounty coins for this match
  matchType: "normal" | "auto_win" | "walkover" | "winners_bracket" | "losers_bracket" | "round_robin"; // Type of match result
  applyLoserDeduction: boolean; // Whether to deduct coins from loser

  // Division System Integration
  squad1Division: SquadDivision; // Division of squad1 at match time
  squad2Division: SquadDivision; // Division of squad2 at match time
  squad1BountyChange: number; // Bounty coin change for squad1
  squad2BountyChange: number; // Bounty coin change for squad2
  divisionChangesProcessed: boolean; // Whether division changes have been processed

  createdAt: Date;
  updatedAt: Date;
}

const tournamentMatchSchema = new Schema<ITournamentMatch>(
  {
    tournament: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    matchNumber: {
      type: Number,
      required: true,
    },
    round: {
      type: Number,
      required: true,
      min: 1,
    },
    squad1: {
      type: Schema.Types.ObjectId,
      ref: "Squad",
      required: true,
    },
    squad2: {
      type: Schema.Types.ObjectId,
      ref: "Squad",
      required: false,
      default: null,
    },
    winner: {
      type: Schema.Types.ObjectId,
      ref: "Squad",
    },
    loser: {
      type: Schema.Types.ObjectId,
      ref: "Squad",
    },
    status: {
      type: String,
      enum: ["scheduled", "in_progress", "completed", "cancelled"],
      default: "scheduled",
    },
    scheduledTime: {
      type: Date,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    score: {
      squad1Score: {
        type: Number,
        min: 0,
      },
      squad2Score: {
        type: Number,
        min: 0,
      },
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    isWalkover: {
      type: Boolean,
      default: false,
    },
    walkoverReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    bountyCoinsDistributed: {
      type: Boolean,
      default: false,
    },
    bountyCoinAmount: {
      type: Number,
      default: 50, // Default bounty coin amount for winning
    },
    matchType: {
      type: String,
      enum: ["normal", "auto_win", "walkover", "winners_bracket", "losers_bracket", "round_robin"],
      default: "normal",
    },
    applyLoserDeduction: {
      type: Boolean,
      default: true,
    },

    // Division System Integration
    squad1Division: {
      type: String,
      enum: Object.values(SquadDivision),
    },
    squad2Division: {
      type: String,
      enum: Object.values(SquadDivision),
    },
    squad1BountyChange: {
      type: Number,
      default: 0,
    },
    squad2BountyChange: {
      type: Number,
      default: 0,
    },
    divisionChangesProcessed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
tournamentMatchSchema.index({ tournament: 1, round: 1 });
tournamentMatchSchema.index(
  { tournament: 1, matchNumber: 1 },
  { unique: true }
);
tournamentMatchSchema.index({ tournament: 1, status: 1 });
tournamentMatchSchema.index({ squad1: 1 });
tournamentMatchSchema.index({ squad2: 1 });
tournamentMatchSchema.index({ scheduledTime: 1 });
tournamentMatchSchema.index({ bountyCoinsDistributed: 1 });
tournamentMatchSchema.index({ divisionChangesProcessed: 1 });

// Validation: Ensure squads are different
tournamentMatchSchema.pre("save", function (next) {
  if (!this.squad2) {
    if (this.matchType !== "auto_win" || this.status !== "completed" ||
      this.winner?.toString() !== this.squad1.toString()) {
      return next(new Error("Only a completed automatic bye may omit squad2"));
    }
  } else if (this.squad1.toString() === this.squad2.toString()) {
    return next(new Error("Squad1 and Squad2 cannot be the same"));
  }
  next();
});

export default mongoose.model<ITournamentMatch>(
  "TournamentMatch",
  tournamentMatchSchema
);
