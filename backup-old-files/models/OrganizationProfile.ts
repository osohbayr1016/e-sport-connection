import mongoose, { Document, Schema } from "mongoose";

export interface IOrganizationProfile extends Document {
  userId: mongoose.Types.ObjectId;
  organizationName: string;
  description: string;
  logo?: string;
  logoPublicId?: string;
  website?: string;
  location?: string;
  foundedYear?: number;
  teamSize?: number;
  games: string[];
  achievements: string[];
  socialMedia: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
    twitch?: string;
  };
  contactInfo: {
    email: string;
    phone?: string;
    address?: string;
  };
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const organizationProfileSchema = new Schema<IOrganizationProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    organizationName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    logo: {
      type: String,
    },
    logoPublicId: {
      type: String,
    },
    website: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    foundedYear: {
      type: Number,
      min: 1900,
      max: new Date().getFullYear(),
    },
    teamSize: {
      type: Number,
      min: 1,
      max: 1000,
    },
    games: [
      {
        type: String,
        trim: true,
      },
    ],
    achievements: [
      {
        type: String,
        trim: true,
        maxlength: 200,
      },
    ],
    socialMedia: {
      facebook: {
        type: String,
        trim: true,
      },
      twitter: {
        type: String,
        trim: true,
      },
      instagram: {
        type: String,
        trim: true,
      },
      youtube: {
        type: String,
        trim: true,
      },
      twitch: {
        type: String,
        trim: true,
      },
    },
    contactInfo: {
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },
      phone: {
        type: String,
        trim: true,
      },
      address: {
        type: String,
        trim: true,
        maxlength: 200,
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance (userId already has unique index from schema)
organizationProfileSchema.index({ organizationName: 1 });
organizationProfileSchema.index({ isActive: 1, isVerified: 1 });

const OrganizationProfile = mongoose.model<IOrganizationProfile>(
  "OrganizationProfile",
  organizationProfileSchema
);

export default OrganizationProfile;
