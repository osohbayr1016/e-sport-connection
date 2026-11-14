import mongoose, { Document, Schema } from "mongoose";

export interface IPlayerProfile extends Document {
  userId: mongoose.Types.ObjectId;
  category: "PC" | "Mobile";
  game: string;
  roles: string[];
  realName?: string;
  inGameName: string;
  mlbbId?: string; // MLBB Game ID (optional)
  rank: string;
  rankStars?: number;
  experience: string;
  bio: string;
  avatar?: string;
  avatarPublicId?: string;
  socialLinks: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    twitch?: string;
    discord?: string;
    website?: string;
  };
  highlightVideo?: string;
  isLookingForTeam: boolean;
  achievements: string[];
  availability: {
    weekdays: boolean;
    weekends: boolean;
    timezone: string;
    preferredHours: string;
  };
  languages: string[];
  createdAt: Date;
  updatedAt: Date;
}

const playerProfileSchema = new Schema<IPlayerProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    category: {
      type: String,
      enum: ["PC", "Mobile"],
      required: true,
    },
    game: {
      type: String,
      required: true,
    },
    roles: {
      type: [String],
      required: true,
    },
    realName: {
      type: String,
      trim: true,
    },
    inGameName: {
      type: String,
      required: true,
    },
    mlbbId: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    rank: {
      type: String,
      required: true,
    },
    rankStars: {
      type: Number,
      min: 100,
    },
    experience: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    avatar: {
      type: String,
    },
    avatarPublicId: {
      type: String,
    },
    socialLinks: {
      twitter: String,
      instagram: String,
      youtube: String,
      twitch: String,
      discord: String,
      website: String,
    },
    highlightVideo: String,
    isLookingForTeam: {
      type: Boolean,
      default: true,
    },
    achievements: [String],
    availability: {
      weekdays: {
        type: Boolean,
        default: true,
      },
      weekends: {
        type: Boolean,
        default: true,
      },
      timezone: {
        type: String,
        default: "UTC+0",
      },
      preferredHours: {
        type: String,
        default: "18:00-22:00",
      },
    },
    languages: {
      type: [String],
      default: ["English"],
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries (userId already has unique index from schema)
playerProfileSchema.index({ game: 1 });
playerProfileSchema.index({ category: 1 });
playerProfileSchema.index({ isLookingForTeam: 1 });

export default mongoose.model<IPlayerProfile>(
  "PlayerProfile",
  playerProfileSchema
);
