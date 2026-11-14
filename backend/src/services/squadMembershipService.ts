import mongoose, { ClientSession } from "mongoose";
import Squad, { SquadJoinType } from "../models/Squad";

/** Uses a single conditional MongoDB write, not a read-then-save race. */
export class SquadMembershipError extends Error {
  constructor(public statusCode: number, message: string) { super(message); }
}

export async function addSquadMemberAtomically(args: {
  squadId: string;
  memberId: string;
  onlyOpen?: boolean;
  leaderId?: string;
  session?: ClientSession;
}) {
  const { squadId, memberId, onlyOpen, leaderId, session } = args;
  if (!mongoose.isValidObjectId(squadId) || !mongoose.isValidObjectId(memberId)) {
    throw new SquadMembershipError(400, "Invalid squad or user ID");
  }
  const member = new mongoose.Types.ObjectId(memberId);
  const filter: Record<string, unknown> = {
    _id: squadId,
    isActive: true,
    members: { $ne: member },
    $expr: { $lt: [{ $size: "$members" }, "$maxMembers"] },
  };
  if (onlyOpen) filter.joinType = SquadJoinType.EVERYONE_CAN_JOIN;
  if (leaderId) filter.leader = leaderId;
  const updated = await Squad.findOneAndUpdate(
    filter,
    { $addToSet: { members: member } },
    { new: true, ...(session ? { session } : {}) }
  );
  if (!updated) {
    throw new SquadMembershipError(409, "Squad is full, inactive, private or user is already a member");
  }
  return updated;
}
