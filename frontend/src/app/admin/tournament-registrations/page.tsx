"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { API_ENDPOINTS } from "../../../config/api";
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Trophy,
  Gamepad2,
  Eye,
  AlertCircle,
} from "lucide-react";

interface TournamentRegistration {
  _id: string;
  tournament: {
    _id: string;
    name: string;
    game: string;
    startDate: string;
    tournamentType: string;
  };
  squad: {
    _id: string;
    name: string;
    tag: string;
  };
  squadLeader: {
    _id: string;
    name: string;
    email: string;
  };
  squadMembers: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  registrationFee: number;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentProof?: string;
  registrationDate: string;
  isApproved: boolean;
  approvalStatus: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  approvedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  approvedAt?: string;
}

export default function AdminTournamentRegistrationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedRegistration, setSelectedRegistration] =
    useState<TournamentRegistration | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (!authLoading && user?.role === "ADMIN") {
      fetchRegistrations();
    }
  }, [user, authLoading]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        API_ENDPOINTS.TOURNAMENT_REGISTRATIONS.PENDING_TAX
      );
      const data = await response.json();

      if (data.success) {
        setRegistrations(data.registrations);
      } else {
        setMessage("Failed to fetch registrations");
      }
    } catch (error) {
      console.error("Error fetching registrations:", error);
      setMessage("Error fetching registrations");
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (
    registrationId: string,
    action: "approve" | "reject"
  ) => {
    if (!user?.id) return;

    try {
      const response = await fetch(
        API_ENDPOINTS.TOURNAMENT_REGISTRATIONS.APPROVE(registrationId),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            adminId: user.id,
            action,
            reason: action === "reject" ? rejectionReason : undefined,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessage(`Registration ${action}d successfully`);
        setRejectionReason("");
        setShowDetailsModal(false);
        setSelectedRegistration(null);
        fetchRegistrations(); // Refresh the list
      } else {
        setMessage(`Failed to ${action} registration: ${data.message}`);
      }
    } catch (error) {
      console.error(`Error ${action}ing registration:`, error);
      setMessage(`Error ${action}ing registration`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "approved":
        return "bg-green-500";
      case "rejected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Хүлээгдэж буй";
      case "approved":
        return "Зөвшөөрөгдсөн";
      case "rejected":
        return "Татгалзсан";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Loading...
            </h1>
          </div>
        </div>
      </div>
    );
  }

  if (user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Access Denied
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              You need admin privileges to access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Tournament Registration Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Review and approve tax tournament registrations
          </p>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <p className="text-blue-800 dark:text-blue-200">{message}</p>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-500 mr-4" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pending
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {
                    registrations.filter((r) => r.approvalStatus === "pending")
                      .length
                  }
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-500 mr-4" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Approved
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {
                    registrations.filter((r) => r.approvalStatus === "approved")
                      .length
                  }
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <XCircle className="w-8 h-8 text-red-500 mr-4" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Rejected
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {
                    registrations.filter((r) => r.approvalStatus === "rejected")
                      .length
                  }
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Trophy className="w-8 h-8 text-purple-500 mr-4" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {registrations.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Registrations List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Pending Tax Tournament Registrations
            </h2>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Loading registrations...
              </p>
            </div>
          ) : registrations.length === 0 ? (
            <div className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No pending registrations found
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {registrations.map((registration) => (
                <div
                  key={registration._id}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center space-x-2">
                          <Gamepad2 className="w-5 h-5 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {registration.tournament.game}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(
                            registration.approvalStatus
                          )}`}
                        >
                          {getStatusText(registration.approvalStatus)}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {registration.tournament.name}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Squad
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {registration.squad.name} #{registration.squad.tag}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Leader
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {registration.squadLeader.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Registration Date
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {formatDate(registration.registrationDate)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          setSelectedRegistration(registration);
                          setShowDetailsModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>

                      {registration.approvalStatus === "pending" && (
                        <>
                          <button
                            onClick={() =>
                              handleApproval(registration._id, "approve")
                            }
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRegistration(registration);
                              setShowDetailsModal(true);
                            }}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedRegistration && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Registration Details
                </h3>
              </div>

              <div className="p-6 space-y-6">
                {/* Tournament Info */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Tournament Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Name
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedRegistration.tournament.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Game
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedRegistration.tournament.game}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Start Date
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatDate(selectedRegistration.tournament.startDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Type
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white capitalize">
                        {selectedRegistration.tournament.tournamentType}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Squad Info */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Squad Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Name
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedRegistration.squad.name} #
                        {selectedRegistration.squad.tag}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Leader
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedRegistration.squadLeader.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Members
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedRegistration.squadMembers.length} players
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Registration Fee
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedRegistration.registrationFee.toLocaleString()}{" "}
                        ₮
                      </p>
                    </div>
                  </div>
                </div>

                {/* Squad Members */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Squad Members
                  </h4>
                  <div className="space-y-2">
                    {selectedRegistration.squadMembers.map((member) => (
                      <div
                        key={member._id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <span className="font-medium text-gray-900 dark:text-white">
                          {member.name}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {member.email}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Proof */}
                {selectedRegistration.paymentProof && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                      Payment Proof
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <img
                        src={selectedRegistration.paymentProof}
                        alt="Payment Proof"
                        className="max-w-full h-auto rounded-lg"
                      />
                    </div>
                  </div>
                )}

                {/* Approval Actions */}
                {selectedRegistration.approvalStatus === "pending" && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      Approval Actions
                    </h4>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Rejection Reason (if rejecting)
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Enter reason for rejection..."
                      />
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={() =>
                          handleApproval(selectedRegistration._id, "approve")
                        }
                        className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve Registration</span>
                      </button>
                      <button
                        onClick={() =>
                          handleApproval(selectedRegistration._id, "reject")
                        }
                        className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject Registration</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedRegistration(null);
                    setRejectionReason("");
                  }}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
