import mongoose, { Document, Schema } from "mongoose";

export interface ITournamentRegistration extends Document {
  tournament: mongoose.Types.ObjectId; // Tournament ID
  squad: mongoose.Types.ObjectId; // Squad ID
  squadLeader: mongoose.Types.ObjectId; // User ID of squad leader
  squadMembers: mongoose.Types.ObjectId[]; // Array of User IDs in the squad
  registrationFee: number; // Amount paid (5000 MNT)
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentDate?: Date;
  paymentReference?: string; // Manually checked bank reference, not provider verification
  paymentVerifiedBy?: mongoose.Types.ObjectId;
  paymentVerifiedAt?: Date;
  paymentProof?: string; // URL to payment proof image
  registrationDate: Date;
  checkedInAt?: Date;
  isApproved: boolean; // Admin approval
  approvedBy?: mongoose.Types.ObjectId; // Admin ID who approved
  approvedAt?: Date;
  approvalStatus: "pending" | "approved" | "rejected"; // Approval status for tax tournaments
  rejectionReason?: string; // Reason for rejection if applicable
  status:
    | "registered"
    | "active"
    | "eliminated"
    | "winner"
    | "runner_up"
    | "third_place";
  tournamentBracket?: any; // Bracket position and matches
  // Disqualification/Ban fields
  isBanned?: boolean;
  banReason?: string;
  bannedAt?: Date;
  bannedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const tournamentRegistrationSchema = new Schema<ITournamentRegistration>(
  {
    tournament: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    squad: {
      type: Schema.Types.ObjectId,
      ref: "Squad",
      required: true,
    },
    squadLeader: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    squadMembers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    registrationFee: {
      type: Number,
      required: true,
      default: 5000, // 5000 MNT
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentDate: {
      type: Date,
    },
    paymentReference: { type: String, trim: true, maxlength: 80 },
    paymentVerifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    paymentVerifiedAt: { type: Date },
    paymentProof: {
      type: String,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    checkedInAt: { type: Date },
    isApproved: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: [
        "registered",
        "active",
        "eliminated",
        "winner",
        "runner_up",
        "third_place",
      ],
      default: "registered",
    },
    tournamentBracket: {
      type: Schema.Types.Mixed,
    },
    // Disqualification/Ban fields
    isBanned: {
      type: Boolean,
      default: false,
      index: true,
    },
    banReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    bannedAt: {
      type: Date,
    },
    bannedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
tournamentRegistrationSchema.index(
  { tournament: 1, squad: 1 },
  { unique: true }
);
tournamentRegistrationSchema.index({ tournament: 1 });
tournamentRegistrationSchema.index({ squad: 1 });
tournamentRegistrationSchema.index({ squadLeader: 1 });
tournamentRegistrationSchema.index({ paymentStatus: 1 });
tournamentRegistrationSchema.index({ paymentReference: 1 }, { unique: true, sparse: true });
tournamentRegistrationSchema.index({ isApproved: 1 });
tournamentRegistrationSchema.index({ approvalStatus: 1 }); // Add index for approval status
tournamentRegistrationSchema.index({ status: 1 });

// Validation: Ensure squad leader is in squad members
tournamentRegistrationSchema.pre("save", function (next) {
  const seen = new Set<string>();
  this.squadMembers = this.squadMembers.filter((member) => {
    const id = member.toString();
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  if (this.squadLeader && !seen.has(this.squadLeader.toString())) {
    this.squadMembers.push(this.squadLeader);
  }
  next();
});

export default mongoose.model<ITournamentRegistration>(
  "TournamentRegistration",
  tournamentRegistrationSchema
);
