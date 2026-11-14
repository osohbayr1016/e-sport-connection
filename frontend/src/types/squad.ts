export enum SquadJoinType {
  INVITE_ONLY = "INVITE_ONLY",
  OPEN_FOR_APPLY = "OPEN_FOR_APPLY",
  EVERYONE_CAN_JOIN = "EVERYONE_CAN_JOIN",
}

export enum SquadDivision {
  SILVER = "SILVER",
  GOLD = "GOLD",
  DIAMOND = "DIAMOND",
}

export enum InvitationStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
  EXPIRED = "EXPIRED",
}

export enum ApplicationStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  WITHDRAWN = "WITHDRAWN",
}

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Squad {
  _id: string;
  name: string;
  tag: string;
  leader: User;
  members: User[];
  maxMembers: number;
  game: "Mobile Legends: Bang Bang"; // Fixed to Mobile Legends only
  description?: string;
  logo?: string;
  isActive: boolean;
  joinType: SquadJoinType;
  level: number;
  experience: number;
  totalBountyCoinsEarned: number;
  totalBountyCoinsSpent: number;
  division: SquadDivision;
  currentBountyCoins: number;
  protectionCount: number;
  consecutiveLosses: number;
  createdAt: string;
  updatedAt: string;
}

export interface SquadInvitation {
  _id: string;
  squad: {
    _id: string;
    name: string;
    tag: string;
    game: "Mobile Legends: Bang Bang";
    logo?: string;
  };
  invitedUser: User;
  invitedBy: User;
  status: InvitationStatus;
  message?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SquadApplication {
  _id: string;
  squad: {
    _id: string;
    name: string;
    tag: string;
    game: "Mobile Legends: Bang Bang";
    logo?: string;
  };
  applicant: User;
  status: ApplicationStatus;
  message?: string;
  responseMessage?: string;
  respondedBy?: User;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SquadInviteRequest {
  invitedUserId: string;
  message?: string;
  userId: string;
}

export interface SquadInviteResponse {
  invitationId: string;
  response: "ACCEPT" | "DECLINE";
  userId: string;
}

export interface SquadApplicationRequest {
  message?: string;
}

export interface SquadApplicationResponse {
  applicationId: string;
  response: "APPROVE" | "REJECT";
  responseMessage?: string;
  userId: string;
}

export interface SquadJoinSettingsUpdate {
  joinType: SquadJoinType;
  userId: string;
}
