"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ProPlayerApplication, ProPlayerStatus } from "@/types/proPlayer";
import proPlayerApi from "@/config/proPlayerApi";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";

const statusColors = {
  [ProPlayerStatus.PENDING]:
    "bg-yellow-600/20 border-yellow-500/30 text-yellow-200",
  [ProPlayerStatus.APPROVED]:
    "bg-green-600/20 border-green-500/30 text-green-200",
  [ProPlayerStatus.REJECTED]: "bg-red-600/20 border-red-500/30 text-red-200",
  [ProPlayerStatus.SUSPENDED]:
    "bg-orange-600/20 border-orange-500/30 text-orange-200",
};

const statusIcons = {
  [ProPlayerStatus.PENDING]: ClockIcon,
  [ProPlayerStatus.APPROVED]: CheckCircleIcon,
  [ProPlayerStatus.REJECTED]: XCircleIcon,
  [ProPlayerStatus.SUSPENDED]: ExclamationTriangleIcon,
};

export default function AdminProPlayersPage() {
  const [applications, setApplications] = useState<ProPlayerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string>("");
  const [selectedApplication, setSelectedApplication] =
    useState<ProPlayerApplication | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string>("");

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const response = await proPlayerApi.getApplications({
          status: selectedStatus || undefined,
          page: currentPage,
          limit: 20,
        });

        if (currentPage === 1) {
          setApplications(response.applications);
        } else {
          setApplications((prev) => [...prev, ...response.applications]);
        }

        setHasMore(response.pagination.hasMore);
        setError("");
      } catch (err) {
        setError("Failed to load applications. Please try again.");
        console.error("Error fetching applications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [selectedStatus, currentPage]);

  const handleStatusUpdate = async (
    id: string,
    status: ProPlayerStatus,
    adminNotes?: string
  ) => {
    try {
      setActionLoading(id);
      await proPlayerApi.updateApplicationStatus(id, status, adminNotes);

      // Update local state
      setApplications((prev) =>
        prev.map((app) =>
          app._id === id
            ? {
                ...app,
                status,
                adminNotes,
                approvedAt:
                  status === ProPlayerStatus.APPROVED
                    ? new Date().toISOString()
                    : undefined,
              }
            : app
        )
      );

      setShowModal(false);
      setSelectedApplication(null);
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status. Please try again.");
    } finally {
      setActionLoading("");
    }
  };

  const openModal = (application: ProPlayerApplication) => {
    setSelectedApplication(application);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedApplication(null);
  };

  const getStatusBadge = (status: ProPlayerStatus) => {
    const Icon = statusIcons[status];
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[status]}`}
      >
        <Icon className="w-4 h-4 mr-2" />
        {status}
      </span>
    );
  };

  const loadMore = () => {
    setCurrentPage((prev) => prev + 1);
  };

  const resetFilters = () => {
    setSelectedStatus("");
    setCurrentPage(1);
  };

  if (loading && currentPage === 1) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-white mt-4 text-lg">Loading applications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Pro Player Applications
          </h1>
          <p className="text-gray-400">
            Manage and approve professional player applications for account
            boosting
          </p>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <label className="text-white font-medium">
                Filter by Status:
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                {Object.values(ProPlayerStatus).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {selectedStatus && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {error && (
            <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {applications.length === 0 && !loading && !error && (
            <div className="text-center py-20">
              <ClockIcon className="w-24 h-24 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-300 mb-2">
                No Applications Found
              </h3>
              <p className="text-gray-400">
                {selectedStatus
                  ? `No applications with status: ${selectedStatus}`
                  : "No applications available"}
              </p>
            </div>
          )}

          {applications.map((application) => (
            <div
              key={application._id}
              className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-gray-600 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Player Info */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                    {application.userId.avatar ? (
                      <Image
                        src={application.userId.avatar}
                        alt={application.userId.name}
                        width={64}
                        height={64}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span>
                        {application.userId.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-white">
                        {application.userId.name}
                      </h3>
                      {getStatusBadge(application.status)}
                    </div>
                    <p className="text-gray-400 text-sm">
                      {application.userId.email}
                    </p>
                  </div>
                </div>

                {/* Game Info */}
                <div className="flex flex-col gap-2 text-sm">
                  <div className="text-center">
                    <span className="text-blue-400 font-medium">
                      {application.game}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-gray-400">${application.price}</span>
                  </div>
                </div>

                {/* Rank Info */}
                <div className="flex flex-col gap-2 text-sm text-center">
                  <div>
                    <span className="text-gray-400">From:</span>
                    <div className="text-white font-medium">
                      {application.currentRank}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">To:</span>
                    <div className="text-white font-medium">
                      {application.targetRank}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex flex-col gap-2 text-sm text-center">
                  <div>
                    <span className="text-gray-400">Boosts:</span>
                    <div className="text-white font-medium">
                      {application.totalBoosts}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Rating:</span>
                    <div className="flex items-center justify-center">
                      <StarIcon className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="text-white">
                        {application.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openModal(application)}
                    className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                    title="View Details"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>

                  {application.status === ProPlayerStatus.PENDING && (
                    <>
                      <button
                        onClick={() =>
                          handleStatusUpdate(
                            application._id,
                            ProPlayerStatus.APPROVED
                          )
                        }
                        disabled={actionLoading === application._id}
                        className="p-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                        title="Approve"
                      >
                        <CheckCircleIcon className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() =>
                          handleStatusUpdate(
                            application._id,
                            ProPlayerStatus.REJECTED
                          )
                        }
                        disabled={actionLoading === application._id}
                        className="p-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                        title="Reject"
                      >
                        <XCircleIcon className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Description Preview */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-gray-300 text-sm line-clamp-2">
                  {application.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="text-center mt-8">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              {loading ? "Loading..." : "Load More Applications"}
            </button>
          </div>
        )}
      </div>

      {/* Application Detail Modal */}
      {showModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  Application Details
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Player Info */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                  {selectedApplication.userId.avatar ? (
                    <Image
                      src={selectedApplication.userId.avatar}
                      alt={selectedApplication.userId.name}
                      width={80}
                      height={80}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span>
                      {selectedApplication.userId.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">
                    {selectedApplication.userId.name}
                  </h3>
                  <p className="text-gray-400">
                    {selectedApplication.userId.email}
                  </p>
                  {getStatusBadge(selectedApplication.status)}
                </div>
              </div>

              {/* Game Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h4 className="text-blue-400 font-medium mb-2">
                    Game Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Game:</span>
                      <span className="text-white">
                        {selectedApplication.game}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Current Rank:</span>
                      <span className="text-white">
                        {selectedApplication.currentRank}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Target Rank:</span>
                      <span className="text-white">
                        {selectedApplication.targetRank}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Price:</span>
                      <span className="text-green-400 font-semibold">
                        ${selectedApplication.price}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Time:</span>
                      <span className="text-white">
                        {selectedApplication.estimatedTime}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h4 className="text-green-400 font-medium mb-2">
                    Player Stats
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Boosts:</span>
                      <span className="text-white">
                        {selectedApplication.totalBoosts}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Successful:</span>
                      <span className="text-white">
                        {selectedApplication.successfulBoosts}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rating:</span>
                      <span className="text-white">
                        {selectedApplication.rating.toFixed(1)}/5
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Reviews:</span>
                      <span className="text-white">
                        {selectedApplication.totalReviews}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-white font-medium mb-2">
                  Service Description
                </h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {selectedApplication.description}
                </p>
              </div>

              {/* Admin Notes */}
              {selectedApplication.adminNotes && (
                <div>
                  <h4 className="text-yellow-400 font-medium mb-2">
                    Admin Notes
                  </h4>
                  <p className="text-gray-300 text-sm">
                    {selectedApplication.adminNotes}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              {selectedApplication.status === ProPlayerStatus.PENDING && (
                <div className="flex gap-3 pt-4 border-t border-gray-700">
                  <button
                    onClick={() =>
                      handleStatusUpdate(
                        selectedApplication._id,
                        ProPlayerStatus.APPROVED
                      )
                    }
                    disabled={actionLoading === selectedApplication._id}
                    className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                  >
                    <CheckCircleIcon className="w-5 h-5 inline mr-2" />
                    Approve Application
                  </button>

                  <button
                    onClick={() =>
                      handleStatusUpdate(
                        selectedApplication._id,
                        ProPlayerStatus.REJECTED
                      )
                    }
                    disabled={actionLoading === selectedApplication._id}
                    className="flex-1 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                  >
                    <XCircleIcon className="w-5 h-5 inline mr-2" />
                    Reject Application
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
