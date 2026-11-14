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
import { useAuth } from "../../../../contexts/AuthContext";
import { SquadApplication, ApplicationStatus } from "../../../../../types/squad";
import {
  getUserApplications,
} from "../../../../../utils/squadService";

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

export default function UserApplicationsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [applications, setApplications] = useState<SquadApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const userId = params.userId as string;

  useEffect(() => {
    if (user && userId) {
      fetchUserApplications();
    }
  }, [user, userId]);

  const fetchUserApplications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token || !user?.id) return;

      const fetchedApplications = await getUserApplications(
        userId,
        token
      );
      setApplications(fetchedApplications);
    } catch (err) {
      setError("Failed to fetch your applications");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.PENDING:
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case ApplicationStatus.APPROVED:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case ApplicationStatus.REJECTED:
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.PENDING:
        return "text-yellow-500";
      case ApplicationStatus.APPROVED:
        return "text-green-500";
      case ApplicationStatus.REJECTED:
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusText = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.PENDING:
        return "Pending";
      case ApplicationStatus.APPROVED:
        return "Approved";
      case ApplicationStatus.REJECTED:
        return "Rejected";
      default:
        return "Unknown";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const pendingApplications = applications.filter(
    (app) => app.status === ApplicationStatus.PENDING
  );
  const processedApplications = applications.filter(
    (app) => app.status !== ApplicationStatus.PENDING
  );

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/squads"
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Squads</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Users className="w-4 h-4" />
                <span>My Applications</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              My Squad Applications
            </h1>
            <p className="text-gray-400">
              Track the status of your squad applications
            </p>
          </div>

          {/* Pending Applications */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                Pending Applications ({pendingApplications.length})
              </h2>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                <span>Awaiting Response</span>
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
                          {application.squad?.logo ? (
                            <Image
                              src={application.squad.logo}
                              alt={application.squad?.name || 'Squad'}
                              width={48}
                              height={48}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                              <Users className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-white font-medium">
                              {application.squad?.name || 'Unknown Squad'}
                            </h3>
                            <span className="text-sm text-gray-400">
                              [{application.squad?.tag || 'N/A'}]
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm mb-2">
                            {application.squad?.game || 'Mobile Legends: Bang Bang'}
                          </p>
                          {application.message && (
                            <div className="mb-2">
                              <div className="flex items-center space-x-2 mb-1">
                                <MessageCircle className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-400">Message:</span>
                              </div>
                              <p className="text-gray-300 text-sm bg-gray-600 p-3 rounded">
                                {application.message}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>Applied {formatDate(application.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(application.status)}
                          <span className={`font-medium ${getStatusColor(application.status)}`}>
                            {getStatusText(application.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Processed Applications */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                Processed Applications ({processedApplications.length})
              </h2>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <UserCheck className="w-4 h-4" />
                <span>Processed</span>
              </div>
            </div>

            {processedApplications.length === 0 ? (
              <div className="text-center py-8">
                <UserCheck className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No processed applications</p>
              </div>
            ) : (
              <div className="space-y-4">
                {processedApplications.map((application) => (
                  <div
                    key={application._id}
                    className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="relative">
                          {application.squad?.logo ? (
                            <Image
                              src={application.squad.logo}
                              alt={application.squad?.name || 'Squad'}
                              width={48}
                              height={48}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                              <Users className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-white font-medium">
                              {application.squad?.name || 'Unknown Squad'}
                            </h3>
                            <span className="text-sm text-gray-400">
                              [{application.squad?.tag || 'N/A'}]
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm mb-2">
                            {application.squad?.game || 'Mobile Legends: Bang Bang'}
                          </p>
                          {application.message && (
                            <div className="mb-2">
                              <div className="flex items-center space-x-2 mb-1">
                                <MessageCircle className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-400">Message:</span>
                              </div>
                              <p className="text-gray-300 text-sm bg-gray-600 p-3 rounded">
                                {application.message}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>Applied {formatDate(application.createdAt)}</span>
                            </div>
                            {application.updatedAt && (
                              <div className="flex items-center space-x-1">
                                <UserCheck className="w-4 h-4" />
                                <span>Responded {formatDate(application.updatedAt)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(application.status)}
                          <span className={`font-medium ${getStatusColor(application.status)}`}>
                            {getStatusText(application.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
