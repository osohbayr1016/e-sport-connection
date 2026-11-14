"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Users,
  User,
  UserCheck,
  UserX,
  Clock,
  MessageCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../../../contexts/AuthContext";
import { SquadApplication, ApplicationStatus } from "../../../../types/squad";
import {
  getSquadApplications,
  respondToApplication,
} from "../../../../utils/squadService";

interface Squad {
  _id: string;
  name: string;
  tag: string;
  leader: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  members: Array<{
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  }>;
  maxMembers: number;
  game: string;
  description?: string;
  logo?: string;
  isActive: boolean;
  joinType: string;
  createdAt: string;
  updatedAt: string;
}

export default function PendingApplicationsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [squad, setSquad] = useState<Squad | null>(null);
  const [applications, setApplications] = useState<SquadApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const squadId = params.id as string;

  useEffect(() => {
    if (user) {
      fetchSquadDetails();
      fetchApplications();
    }
  }, [user, squadId]);

  const fetchSquadDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/squads/${squadId}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSquad(data.squad);
      } else {
        setError("Failed to fetch squad details");
      }
    } catch (err) {
      setError("Failed to fetch squad details");
    }
  };

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token || !user?.id) return;

      const fetchedApplications = await getSquadApplications(
        squadId,
        user.id,
        token
      );
      setApplications(fetchedApplications);
    } catch (err) {
      setError("Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationResponse = async (
    applicationId: string,
    response: "APPROVE" | "REJECT",
    responseMessage?: string
  ) => {
    try {
      setActionLoading(applicationId);
      const token = localStorage.getItem("token");
      if (!token || !user?.id) return;

      await respondToApplication(
        squadId,
        {
          applicationId,
          response,
          responseMessage,
          userId: user.id,
        },
        token
      );

      // Refresh applications after response
      await fetchApplications();
      await fetchSquadDetails(); // Refresh squad details to get updated member count
    } catch (err: any) {
      setError(err.message || "Failed to respond to application");
    } finally {
      setActionLoading(null);
    }
  };

  const isUserLeader = () => {
    if (!user?.id || !squad?.leader) return false;
    return squad.leader._id === user.id;
  };

  const getStatusIcon = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.PENDING:
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case ApplicationStatus.APPROVED:
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case ApplicationStatus.REJECTED:
        return <XCircle className="w-4 h-4 text-red-400" />;
      case ApplicationStatus.WITHDRAWN:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.PENDING:
        return "text-yellow-400";
      case ApplicationStatus.APPROVED:
        return "text-green-400";
      case ApplicationStatus.REJECTED:
        return "text-red-400";
      case ApplicationStatus.WITHDRAWN:
        return "text-gray-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusLabel = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.PENDING:
        return "Pending";
      case ApplicationStatus.APPROVED:
        return "Approved";
      case ApplicationStatus.REJECTED:
        return "Rejected";
      case ApplicationStatus.WITHDRAWN:
        return "Withdrawn";
      default:
        return "Unknown";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!squad) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Squad Not Found
          </h1>
          <Link
            href="/squads"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Squads
          </Link>
        </div>
      </div>
    );
  }

  if (!isUserLeader()) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-6">
            Only squad leaders can view applications.
          </p>
          <Link
            href={`/squads/${squadId}`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Squad
          </Link>
        </div>
      </div>
    );
  }

  const pendingApplications = applications.filter(
    (app) => app.status === ApplicationStatus.PENDING
  );
  const otherApplications = applications.filter(
    (app) => app.status !== ApplicationStatus.PENDING
  );


  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href={`/squads/${squadId}`}
                className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Squad
              </Link>
              <div className="h-6 w-px bg-gray-600"></div>
              <div className="flex items-center space-x-3">
                {squad.logo && (
                  <Image
                    src={squad.logo}
                    alt={`${squad.name} logo`}
                    width={40}
                    height={40}
                    className="rounded-lg"
                  />
                )}
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {squad.name} - Applications
                  </h1>
                  <p className="text-gray-400">[{squad.tag}]</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-400">
                <Users className="w-4 h-4 inline mr-1" />
                {squad.members.length}/{squad.maxMembers} members
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg"
          >
            <p className="text-red-400">{error}</p>
          </motion.div>
        )}

        <div className="space-y-8">
          {/* Pending Applications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                Pending Applications ({pendingApplications.length})
              </h2>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                <span>Awaiting Review</span>
              </div>
            </div>

            {pendingApplications.length === 0 ? (
              <div className="text-center py-8">
                <UserCheck className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No pending applications</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingApplications.map((application) => (
                  <div
                    key={application._id}
                    className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="relative">
                          {application.applicant?.avatar ? (
                            <Image
                              src={application.applicant?.avatar}
                              alt={application.applicant?.name || 'Unknown User'}
                              width={48}
                              height={48}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                              <User className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-white font-medium">
                              {application.applicant?.name || 'Unknown User'}
                            </h3>
                            <span className="text-gray-400 text-sm">
                              {application.applicant?.email || 'No email available'}
                            </span>
                          </div>
                          {application.message && (
                            <div className="mb-3">
                              <div className="flex items-center space-x-2 mb-1">
                                <MessageCircle className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-400">
                                  Message:
                                </span>
                              </div>
                              <p className="text-gray-300 text-sm bg-gray-600 rounded p-2">
                                {application.message}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center space-x-2 text-sm text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>
                              Applied{" "}
                              {new Date(
                                application.createdAt
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            handleApplicationResponse(
                              application._id,
                              "APPROVE"
                            )
                          }
                          disabled={actionLoading === application._id}
                          className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          <UserCheck className="w-4 h-4 mr-2" />
                          {actionLoading === application._id
                            ? "Approving..."
                            : "Approve"}
                        </button>
                        <button
                          onClick={() =>
                            handleApplicationResponse(application._id, "REJECT")
                          }
                          disabled={actionLoading === application._id}
                          className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          {actionLoading === application._id
                            ? "Rejecting..."
                            : "Reject"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Other Applications */}
          {otherApplications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800 rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  Other Applications ({otherApplications.length})
                </h2>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <UserCheck className="w-4 h-4" />
                  <span>Processed</span>
                </div>
              </div>

              <div className="space-y-4">
                {otherApplications.map((application) => (
                  <div
                    key={application._id}
                    className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="relative">
                          {application.applicant?.avatar ? (
                            <Image
                              src={application.applicant?.avatar}
                              alt={application.applicant?.name || 'Unknown User'}
                              width={48}
                              height={48}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                              <User className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-white font-medium">
                              {application.applicant?.name || 'Unknown User'}
                            </h3>
                            <span className="text-gray-400 text-sm">
                              {application.applicant?.email || 'No email available'}
                            </span>
                          </div>
                          {application.message && (
                            <div className="mb-3">
                              <div className="flex items-center space-x-2 mb-1">
                                <MessageCircle className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-400">
                                  Message:
                                </span>
                              </div>
                              <p className="text-gray-300 text-sm bg-gray-600 rounded p-2">
                                {application.message}
                              </p>
                            </div>
                          )}
                          {application.responseMessage && (
                            <div className="mb-3">
                              <div className="flex items-center space-x-2 mb-1">
                                <MessageCircle className="w-4 h-4 text-blue-400" />
                                <span className="text-sm text-blue-400">
                                  Response:
                                </span>
                              </div>
                              <p className="text-gray-300 text-sm bg-blue-900/20 rounded p-2 border border-blue-500/30">
                                {application.responseMessage}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-3 h-3" />
                              <span>
                                Applied{" "}
                                {new Date(
                                  application.createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            {application.respondedAt && (
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="w-3 h-3" />
                                <span>
                                  Responded{" "}
                                  {new Date(
                                    application.respondedAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div
                          className={`flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-600`}
                        >
                          {getStatusIcon(application.status)}
                          <span
                            className={`text-sm font-medium ${getStatusColor(
                              application.status
                            )}`}
                          >
                            {getStatusLabel(application.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
