import mongoose, { Document, Schema } from "mongoose";

export enum NotificationType {
  MESSAGE = "MESSAGE",
  SYSTEM = "SYSTEM",
}

export enum NotificationStatus {
  PENDING = "PENDING",
  SEEN = "SEEN",
  DELETED = "DELETED",
}

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  content: string;
  relatedMessageId?: mongoose.Types.ObjectId;
  status: NotificationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      default: NotificationType.MESSAGE,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    relatedMessageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    status: {
      type: String,
      enum: Object.values(NotificationStatus),
      default: NotificationStatus.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
notificationSchema.index({ recipientId: 1, status: 1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ senderId: 1, recipientId: 1 });

export default mongoose.model<INotification>(
  "Notification",
  notificationSchema
);
