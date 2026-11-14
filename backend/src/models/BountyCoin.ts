import { Schema, model, Document } from "mongoose";

export interface IBountyCoin extends Document {
  userId: Schema.Types.ObjectId;
  squadId?: Schema.Types.ObjectId;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  transactions: Array<{
    type: "earn" | "spend" | "purchase" | "withdraw";
    amount: number;
    description: string;
    tournamentId?: Schema.Types.ObjectId;
    matchId?: Schema.Types.ObjectId;
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const bountyCoinSchema = new Schema<IBountyCoin>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    squadId: {
      type: Schema.Types.ObjectId,
      ref: "Squad",
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    transactions: [
      {
        type: {
          type: String,
          enum: ["earn", "spend", "purchase", "withdraw"],
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        tournamentId: {
          type: Schema.Types.ObjectId,
          ref: "Tournament",
        },
        matchId: {
          type: Schema.Types.ObjectId,
          ref: "TournamentMatch",
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
// userId already has a unique index declared in its schema field.
bountyCoinSchema.index({ squadId: 1 });

export default model<IBountyCoin>("BountyCoin", bountyCoinSchema);
