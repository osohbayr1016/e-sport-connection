import mongoose, { Document, Schema } from "mongoose";

export interface ITournament extends Document {
  name: string;
  description: string;
  game: string;
  startDate: Date;
  endDate: Date;
  prizePool: number;
  prizeDistribution: {
    firstPlace: number;
    secondPlace: number;
    thirdPlace: number;
  };
  bracketRevision: number; // Serializes tournament progression across workers
  maxSquads: number; // Maximum number of squads allowed
  currentSquads: number; // Current number of registered squads
  status:
    | "upcoming"
    | "registration_open"
    | "registration_closed"
    | "ongoing"
    | "completed"
    | "cancelled";
  location: string;
  organizer: string;
  organizerLogo?: string; // Organizer profile picture
  bannerImage?: string; // Tournament banner image
  rules: string;
  registrationDeadline: Date;
  entryFee: number; // Registration fee (5000 MNT)
  tournamentType: "tax" | "free"; // Tournament type: tax (requires payment) or free
  format: string; // Tournament format (Single Elimination, Double Elimination, etc.)
  brackets?: any; // Tournament bracket structure
  createdAt: Date;
  updatedAt: Date;
}

const tournamentSchema = new Schema<ITournament>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    game: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    prizePool: {
      type: Number,
      required: true,
      min: 0,
    },
    prizeDistribution: {
      firstPlace: {
        type: Number,
        required: true,
        min: 0,
      },
      secondPlace: {
        type: Number,
        required: true,
        min: 0,
      },
      thirdPlace: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    bracketRevision: { type: Number, default: 0, min: 0 },
    maxSquads: {
      type: Number,
      required: true,
      min: 2,
    },
    currentSquads: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        "upcoming",
        "registration_open",
        "registration_closed",
        "ongoing",
        "completed",
        "cancelled",
      ],
      default: "upcoming",
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    organizer: {
      type: String,
      required: true,
      trim: true,
    },
    organizerLogo: {
      type: String,
    },
    bannerImage: {
      type: String,
    },
    rules: {
      type: String,
      trim: true,
    },
    registrationDeadline: {
      type: Date,
      required: true,
    },
    entryFee: {
      type: Number,
      required: true,
      default: 5000, // 5000 MNT
      min: 0,
    },
    tournamentType: {
      type: String,
      enum: ["tax", "free"],
      required: true,
      default: "tax", // Default to tax tournament
    },
    format: {
      type: String,
      required: true,
      default: "Single Elimination",
      trim: true,
    },
    brackets: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
tournamentSchema.index({ game: 1 });
tournamentSchema.index({ status: 1 });
tournamentSchema.index({ startDate: 1 });
tournamentSchema.index({ organizer: 1 });
tournamentSchema.index({ tournamentType: 1 }); // Add index for tournament type
tournamentSchema.index({ name: "text", description: "text" });

export default mongoose.model<ITournament>("Tournament", tournamentSchema);
