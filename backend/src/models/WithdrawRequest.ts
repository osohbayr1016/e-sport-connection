import mongoose, { Schema, Document } from "mongoose";

export type WithdrawStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID";

export interface IWithdrawRequest extends Document {
  squadId: Schema.Types.ObjectId;
  requestedBy: Schema.Types.ObjectId; // user id (usually squad leader)
  amountCoins: number;
  amountMNT: number;
  bankName: string;
  iban: string;
  status: WithdrawStatus;
  adminNotes?: string;
  processedBy?: Schema.Types.ObjectId; // admin user id
  processedAt?: Date;
  paidBy?: Schema.Types.ObjectId; // admin who marked as paid
  paidAt?: Date;
  bankTransferReference?: string; // Traceable manual settlement reference; not bank verification
  createdAt: Date;
  updatedAt: Date;
}

const withdrawRequestSchema = new Schema<IWithdrawRequest>(
  {
    squadId: {
      type: Schema.Types.ObjectId,
      ref: "Squad",
      required: true,
      index: true,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amountCoins: {
      type: Number,
      required: true,
      min: 1,
    },
    amountMNT: {
      type: Number,
      required: true,
      min: 1,
    },
    bankName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    iban: {
      type: String,
      required: true,
      trim: true,
      maxlength: 64,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "PAID"],
      default: "PENDING",
      index: true,
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    processedAt: {
      type: Date,
    },
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    paidAt: {
      type: Date,
    },
    bankTransferReference: {
      type: String,
      trim: true,
      maxlength: 80,
    },
  },
  { timestamps: true }
);

withdrawRequestSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<IWithdrawRequest>(
  "WithdrawRequest",
  withdrawRequestSchema
);
