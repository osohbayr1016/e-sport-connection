import mongoose from "mongoose";
import Message from "../models/Message";

// Mongoose objects may be hydrated or populated; always compare semantic IDs.
const idOf = (value: any): string =>
  value?._id?.toString?.() || value?.toString?.() || "";

export function sameConversationReply(
  reply: { senderId: unknown; receiverId: unknown } | null | undefined,
  sender: unknown,
  receiver: unknown
): boolean {
  if (!reply) return false;
  const actual = [idOf(reply.senderId), idOf(reply.receiverId)].sort();
  const expected = [idOf(sender), idOf(receiver)].sort();
  return !!actual[0] && !!actual[1] && actual[0] === expected[0] && actual[1] === expected[1];
}

export async function validateDirectMessageReply(
  replyToId: unknown,
  senderId: string,
  receiverId: string
): Promise<void> {
  if (replyToId === undefined || replyToId === null || replyToId === "") return;
  if (typeof replyToId !== "string" || !mongoose.isValidObjectId(replyToId)) {
    throw new InvalidDirectMessageReplyError();
  }
  const exists = await Message.exists({
    _id: replyToId,
    $or: [
      { senderId, receiverId },
      { senderId: receiverId, receiverId: senderId },
    ],
  });
  if (!exists) throw new InvalidDirectMessageReplyError();
}

export class InvalidDirectMessageReplyError extends Error {
  constructor() {
    super("Reply must reference a message from this conversation");
    this.name = "InvalidDirectMessageReplyError";
  }
}
