"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  Crown,
  User,
  Gamepad2,
  Calendar,
  Shield,
  Star,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  X,
  ArrowLeft,
  Trophy,
  Target,
  Clock,
  MapPin,
  MessageCircle,
  Settings,
  Save,
  Upload,
  Lock,
  Unlock,
  UserCheck,
  Copy,
  Check,
} from "lucide-react";
import { FaCoins } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";
import { API_ENDPOINTS } from "../../../config/api";
import { SquadJoinType } from "../../../types/squad";
import {
  getJoinTypeLabel,
  getJoinTypeDescription,
  canApplyToSquad,
  applyToSquad,
} from "../../../utils/squadService";
import DivisionCoinImage from "../../../components/DivisionCoinImage";
import { SquadDivision } from "../../../types/division";
import MatchHistory from "./components/MatchHistory";

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
  game: "Mobile Legends: Bang Bang"; // Fixed to Mobile Legends only
  description?: string;
  logo?: string;
  isActive: boolean;
  joinType: SquadJoinType;
  createdAt: string;
  updatedAt: string;
  level: number;
  experience: number;
  totalBountyCoinsEarned: number;
  totalBountyCoinsSpent: number;
  division: SquadDivision;
  currentBountyCoins: number;
  protectionCount: number;
  consecutiveLosses: number;
}

interface SquadStats {
  totalMembers: number;
  availableSlots: number;
  memberPercentage: number;
  daysSinceCreated: number;
  squadDivision?: {
    name: string;
    displayName: string;
    currentBountyCoins: number;
    canUpgrade: boolean;
    protectionCount: number;
    consecutiveLosses: number;
    progress: number;
  };
}

interface EditSquadForm {
  name: string;
  tag: string;
  game: "Mobile Legends: Bang Bang"; // Fixed to Mobile Legends only
  description: string;
  maxMembers: number;
  isActive: boolean;
  joinType: SquadJoinType;
}

interface BountySummary {
  squadId: string;
  squadName: string;
  squadTag: string;
  currentBountyCoins: number;
  totalEarned: number;
  totalSpent: number;
  division: string;
}

interface DivisionInfoItem {
  name: string; // SILVER | GOLD | DIAMOND
  displayName: string;
  requirements: string | null;
  upgradeCost: number | null;
  bountyCoinPrice: number; // MNT per 50 coins
  bountyCoinAmount: number; // usually 50
  deductionAmount: number; // usually 25
}

export default function SquadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [squad, setSquad] = useState<Squad | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [stats, setStats] = useState<SquadStats | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState<EditSquadForm>({
    name: "",
    tag: "",
    game: "Mobile Legends: Bang Bang",
    description: "",
    maxMembers: 7,
    isActive: true,
    joinType: SquadJoinType.OPEN_FOR_APPLY,
  });
  const [applicationMessage, setApplicationMessage] = useState("");
  const [bountySummary, setBountySummary] = useState<BountySummary | null>(
    null
  );
  const [divisionInfo, setDivisionInfo] = useState<DivisionInfoItem[] | null>(
    null
  );
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [memberActionLoading, setMemberActionLoading] = useState<string | null>(
    null
  );
  const [transferLoadingId, setTransferLoadingId] = useState<string | null>(
    null
  );
  const [addMemberId, setAddMemberId] = useState("");
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amountCoins: 0,
    bankName: "",
    iban: "",
  });
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [showBuyBountyModal, setShowBuyBountyModal] = useState(false);
  const [buyBountyForm, setBuyBountyForm] = useState({
    amount: 50,
    customAmount: "",
  });
  const [buyBountySubmitting, setBuyBountySubmitting] = useState(false);
  const [accountNumberCopied, setAccountNumberCopied] = useState(false);

  const squadId = params.id as string;

  useEffect(() => {
    fetchSquadDetails();
    fetchBountyAndDivisionInfo();
  }, [squadId]);

  useEffect(() => {
    if (squad) {
      calculateStats();
      // Initialize edit form with current squad data
      setEditForm({
        name: squad.name,
        tag: squad.tag,
        game: "Mobile Legends: Bang Bang", // Always Mobile Legends
        description: squad.description || "",
        maxMembers: squad.maxMembers,
        isActive: squad.isActive,
        joinType: squad.joinType,
      });
    }
  }, [squad]);

  const fetchBountyAndDivisionInfo = async () => {
    try {
      // Bounty summary for this squad
      const bountyRes = await fetch(
        API_ENDPOINTS.BOUNTY_COINS.SQUAD_SUMMARY(squadId)
      );
      if (bountyRes.ok) {
        const bountyData = await bountyRes.json();
        if (bountyData?.success) {
          setBountySummary(bountyData.data as BountySummary);
        }
      }

      // Division config info (prices, amounts)
      const divRes = await fetch(API_ENDPOINTS.DIVISIONS.INFO);
      if (divRes.ok) {
        const divData = await divRes.json();
        if (divData?.success) {
          setDivisionInfo(divData.data as DivisionInfoItem[]);
        }
      }
    } catch (error) {
      console.error("Error fetching bounty/division info:", error);
    }
  };

  const fetchSquadDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/squads/${squadId}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch squad details");
      }

      const data = await response.json();
      if (data.success) {
        setSquad(data.squad);
      } else {
        setError(data.message || "Failed to load squad");
      }
    } catch (err) {
      setError("Failed to load squad details");
      console.error("Error fetching squad:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = async () => {
    if (!squad || !squad.members) return;

    const totalMembers = squad.members.length;
    const availableSlots = Math.max(0, squad.maxMembers - totalMembers);
    const memberPercentage = (totalMembers / squad.maxMembers) * 100;
    const daysSinceCreated = Math.floor(
      (new Date().getTime() - new Date(squad.createdAt).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    // Fetch squad division info
    let squadDivisionInfo = null;
    try {
      if (squad._id) {
        const response = await fetch(
          API_ENDPOINTS.DIVISIONS.SQUAD_INFO(squad._id)
        );
        if (response.ok) {
          const data = await response.json();
          squadDivisionInfo = data.data;
        }
      }
    } catch (error) {
      console.error("Error fetching squad division info:", error);
    }

    setStats({
      totalMembers,
      availableSlots,
      memberPercentage,
      daysSinceCreated,
      squadDivision: squadDivisionInfo,
    });
  };

  const getDivisionDisplayName = () => {
    if (!stats?.squadDivision) return "Division";
    return (
      stats.squadDivision.displayName ||
      getDivisionNameFromEnum(stats.squadDivision.name) ||
      "Division"
    );
  };

  const getDivisionNameFromEnum = (divisionName: string) => {
    switch (divisionName) {
      case "SILVER":
        return "Silver Division";
      case "GOLD":
        return "Gold Division";
      case "DIAMOND":
        return "Diamond Division";
      default:
        return "Division";
    }
  };

  const getUpgradeCost = (division: string) => {
    switch (division) {
      case "SILVER":
        return 250;
      case "GOLD":
        return 750;
      default:
        return null;
    }
  };

  const handleUpgradeDivision = async () => {
    if (!user?.id || !squad) return;

    const upgradeCost = getUpgradeCost(squad.division || "SILVER");
    if (!upgradeCost) {
      setError("Cannot upgrade from current division");
      return;
    }

    const currentCoins =
      bountySummary?.currentBountyCoins ??
      stats?.squadDivision?.currentBountyCoins ??
      0;
    if (currentCoins < upgradeCost) {
      setError(
        `Insufficient bounty coins. Need ${upgradeCost} BC, have ${currentCoins} BC`
      );
      return;
    }

    try {
      setUpgradeLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/divisions/upgrade/${squad._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        setError(data.error || "Failed to upgrade division");
        return;
      }

      // Refresh data after successful upgrade
      await fetchBountyAndDivisionInfo();
      await fetchSquadDetails();
      setError(""); // Clear any previous errors
    } catch (e) {
      console.error("Error upgrading division:", e);
      setError("Failed to upgrade division");
    } finally {
      setUpgradeLoading(false);
    }
  };

  const copyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText("380032005005896566");
      setAccountNumberCopied(true);
      setTimeout(() => setAccountNumberCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy account number:", err);
    }
  };

  const handleBuyBountyCoins = async () => {
    if (!user?.id || !squad) return;
    if (!buyBountyForm.amount || buyBountyForm.amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    try {
      setBuyBountySubmitting(true);
      const token = localStorage.getItem("token");
      const res = await fetch(API_ENDPOINTS.BOUNTY_COINS.REQUEST_PURCHASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          squadId: squad._id,
          amount: buyBountyForm.amount,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        setError(data.message || "Failed to submit recharge request");
        return;
      }

      // Reset form and close modal
      setBuyBountyForm({ amount: 50, customAmount: "" });
      setShowBuyBountyModal(false);
      setError(""); // Clear any previous errors

      // Show success message
      alert(
        "Recharge request submitted successfully! Admin will review and process your request."
      );
    } catch (e) {
      console.error("Error submitting recharge request:", e);
      setError("Failed to submit recharge request");
    } finally {
      setBuyBountySubmitting(false);
    }
  };

  const getDivisionPricePerPack = () => {
    const divisionName = (bountySummary?.division ||
      stats?.squadDivision?.name ||
      "SILVER") as string;
    const info = divisionInfo?.find((d) => d.name === divisionName);
    return info?.bountyCoinPrice || 10000; // default SILVER price
  };

  const getDivisionPackAmount = () => {
    const divisionName = (bountySummary?.division ||
      stats?.squadDivision?.name ||
      "SILVER") as string;
    const info = divisionInfo?.find((d) => d.name === divisionName);
    return info?.bountyCoinAmount || 50;
  };

  const toMNT = (coins: number) => {
    const pack = getDivisionPackAmount();
    const price = getDivisionPricePerPack();
    const mnt = (coins / pack) * price;
    return Math.round(mnt);
  };

  const openWithdraw = () => {
    setWithdrawForm({ amountCoins: 0, bankName: "", iban: "" });
    setShowWithdrawModal(true);
  };

  const submitWithdraw = async () => {
    if (!user?.id || !squad) return;
    if (!withdrawForm.amountCoins || withdrawForm.amountCoins <= 0) return;
    if (!withdrawForm.bankName.trim() || !withdrawForm.iban.trim()) return;

    try {
      setWithdrawSubmitting(true);
      const token = localStorage.getItem("token");
      const res = await fetch(API_ENDPOINTS.BOUNTY_COINS.WITHDRAW_CREATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          squadId: squad._id,
          amountCoins: withdrawForm.amountCoins,
          bankName: withdrawForm.bankName.trim(),
          iban: withdrawForm.iban.trim(),
        }),
      });

      if (res.ok) {
        await fetchBountyAndDivisionInfo();
        await fetchSquadDetails();
        setShowWithdrawModal(false);
      } else {
        const data = await res.json();
        setError(data.message || "Failed to submit withdraw request");
      }
    } catch (e) {
      console.error("Withdraw request failed", e);
      setError("Failed to submit withdraw request");
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  const handlePurchaseCoins = async (amount: number) => {
    try {
      setPurchaseLoading(true);
      const res = await fetch(API_ENDPOINTS.DIVISIONS.PURCHASE(squadId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (res.ok) {
        await fetchBountyAndDivisionInfo();
        await calculateStats();
      }
    } catch (e) {
      console.error("Purchase failed", e);
    } finally {
      setPurchaseLoading(false);
    }
  };

  const isUserLeader = () => {
    if (!user?.id || !squad?.leader) return false;
    return user.id === squad.leader._id;
  };

  const isUserMember = () => {
    if (!user?.id || !squad?.members) return false;
    return squad.members.some((member) => member._id === user.id) || false;
  };

  const canJoinSquad = () => {
    if (!squad || !squad.members) return false;
    return (
      !isUserMember() &&
      !isUserLeader() &&
      squad.members.length < squad.maxMembers &&
      squad.isActive
    );
  };

  const handleJoinSquad = async () => {
    if (!user?.id) {
      setError("You must be logged in to join a squad");
      return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/squads/${squadId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        // Refresh squad details
        await fetchSquadDetails();
      } else {
        const data = await response.json();
        setError(data.message || "Failed to join squad");
      }
    } catch (err) {
      setError("Failed to join squad");
      console.error("Error joining squad:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveSquad = async () => {
    if (!user?.id) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/squads/${squadId}/leave`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        // Redirect to squads page
        router.push("/squads");
      } else {
        const data = await response.json();
        setError(data.message || "Failed to leave squad");
      }
    } catch (err) {
      setError("Failed to leave squad");
      console.error("Error leaving squad:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSquad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      setEditLoading(true);
      const token = localStorage.getItem("token");

      // Update squad details
      const response = await fetch(`/api/squads/${squadId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          ...editForm,
          userId: user.id,
        }),
      });

      if (response.ok) {
        // Refresh squad details
        await fetchSquadDetails();
        setShowEditModal(false);
        setError(""); // Clear any previous errors
      } else {
        const data = await response.json();
        setError(data.message || "Failed to update squad");
      }
    } catch (err) {
      setError("Failed to update squad");
      console.error("Error updating squad:", err);
    } finally {
      setEditLoading(false);
    }
  };

  const handleApplyToSquad = async () => {
    if (!squad || !user) return;

    setActionLoading(true);
    const token = localStorage.getItem("token");

    try {
      await applyToSquad(
        squadId,
        {
          message: applicationMessage.trim() || undefined,
        },
        token || ""
      );

      setError("");
      setApplicationMessage("");
      setShowApplyModal(false);
      // Show success message or redirect
      alert(
        "Application submitted successfully! The squad leader will review your application."
      );
    } catch (error: any) {
      setError(error.message || "Failed to submit application");
    } finally {
      setActionLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: name === "maxMembers" ? parseInt(value) : value,
    }));
  };

  const handleJoinTypeChange = (joinType: SquadJoinType) => {
    setEditForm((prev) => ({
      ...prev,
      joinType,
    }));
  };

  const getJoinTypeIcon = (joinType: SquadJoinType) => {
    switch (joinType) {
      case SquadJoinType.INVITE_ONLY:
        return <Lock className="w-4 h-4" />;
      case SquadJoinType.OPEN_FOR_APPLY:
        return <UserCheck className="w-4 h-4" />;
      case SquadJoinType.EVERYONE_CAN_JOIN:
        return <Unlock className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const handleDeleteSquad = async () => {
    if (!isUserLeader()) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/squads/${squadId}`, {
        method: "DELETE",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        router.push("/squads");
      } else {
        const data = await response.json();
        setError(data.message || "Failed to delete squad");
      }
    } catch (err) {
      setError("Failed to delete squad");
      console.error("Error deleting squad:", err);
    } finally {
      setActionLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!isUserLeader() || !user?.id) return;

    try {
      setMemberActionLoading(memberId);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/squads/${squadId}/members/${memberId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({ userId: user.id }),
        }
      );

      if (response.ok) {
        await fetchSquadDetails();
        setError("");
      } else {
        const data = await response.json();
        setError(data.message || "Failed to remove member");
      }
    } catch (err) {
      setError("Failed to remove member");
      console.error("Error removing member:", err);
    } finally {
      setMemberActionLoading(null);
    }
  };

  const handleAddMember = async () => {
    if (!isUserLeader() || !user?.id || !addMemberId.trim()) return;

    try {
      setAddMemberLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/squads/${squadId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          newMemberId: addMemberId.trim(),
          userId: user.id,
        }),
      });

      if (response.ok) {
        await fetchSquadDetails();
        setAddMemberId("");
        setError("");
      } else {
        const data = await response.json();
        setError(data.message || "Failed to add member");
      }
    } catch (err) {
      setError("Failed to add member");
      console.error("Error adding member:", err);
    } finally {
      setAddMemberLoading(false);
    }
  };

  const handleTransferLeadership = async (memberId: string) => {
    if (!isUserLeader() || !user?.id) return;

    try {
      setTransferLoadingId(memberId);
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/squads/${squadId}/leader`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ newLeaderId: memberId, userId: user.id }),
      });

      if (response.ok) {
        await fetchSquadDetails();
        setError("");
      } else {
        const data = await response.json();
        setError(data.message || "Failed to transfer leadership");
      }
    } catch (err) {
      setError("Failed to transfer leadership");
      console.error("Error transferring leadership:", err);
    } finally {
      setTransferLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading squad details...</p>
        </div>
      </div>
    );
  }

  if (error && !squad) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
          <p className="text-gray-400 mb-4">{error}</p>
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

  if (!squad) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Squad Not Found
          </h1>
          <p className="text-gray-400 mb-4">
            The squad you&apos;re looking for doesn&apos;t exist.
          </p>
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

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/squads"
                className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Squads
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
                    {squad.name || "Unnamed Squad"}
                  </h1>
                  <p className="text-gray-400">[{squad.tag || "TAG"}]</p>

                  {/* Squad Level, Division and BC Info */}
                  <div className="flex items-center space-x-4 mt-2">
                    {/* Squad Division Badge (replaces Level badge) */}
                    <div className="flex items-center space-x-2">
                      <DivisionCoinImage
                        division={
                          (squad.division as SquadDivision) ||
                          (stats?.squadDivision?.name as SquadDivision) ||
                          "SILVER"
                        }
                        size={20}
                        showGlow={true}
                      />
                      <span className="text-sm bg-yellow-400 text-gray-900 px-2 py-1 rounded">
                        {stats?.squadDivision?.displayName ||
                          squad.division ||
                          "SILVER"}
                      </span>
                    </div>

                    {/* Squad Division and BC Info */}
                    {stats && stats.squadDivision && (
                      <>
                        <div className="flex items-center space-x-2">
                          <DivisionCoinImage
                            division={
                              (squad.division as SquadDivision) ||
                              (stats.squadDivision.name as SquadDivision) ||
                              "SILVER"
                            }
                            size={24}
                            showGlow={true}
                          />
                          <span className="text-sm text-gray-300">
                            {getDivisionNameFromEnum(stats.squadDivision.name)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FaCoins className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm text-yellow-400 font-medium">
                            {stats.squadDivision.currentBountyCoins || 0} BC
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {isUserLeader() && (
                <>
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={openWithdraw}
                    className="inline-flex items-center px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    <FaCoins className="w-4 h-4 mr-2" />
                    Withdraw
                  </button>
                  <button
                    onClick={() => setShowBuyBountyModal(true)}
                    className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FaCoins className="w-4 h-4 mr-2" />
                    Buy Bounty Coins
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </>
              )}

              {squad && canApplyToSquad(squad) && !isUserMember() && (
                <button
                  onClick={() => setShowApplyModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Apply to Join
                </button>
              )}

              {canJoinSquad() && (
                <button
                  onClick={handleJoinSquad}
                  disabled={actionLoading}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {actionLoading ? "Joining..." : "Join Squad"}
                </button>
              )}

              {isUserMember() && !isUserLeader() && (
                <button
                  onClick={handleLeaveSquad}
                  disabled={actionLoading}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <UserMinus className="w-4 h-4 mr-2" />
                  {actionLoading ? "Leaving..." : "Leave Squad"}
                </button>
              )}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Squad Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 rounded-lg p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-4">
                Squad Overview
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Gamepad2 className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-gray-400 text-sm">Game</p>
                      <p className="text-white font-medium">{squad.game}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-gray-400 text-sm">Members</p>
                      <p className="text-white font-medium">
                        {squad.members ? squad.members.length : 0}/
                        {squad.maxMembers}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-gray-400 text-sm">Created</p>
                      <p className="text-white font-medium">
                        {new Date(squad.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-gray-400 text-sm">Status</p>
                      <p
                        className={`font-medium ${
                          squad.isActive ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {squad.isActive ? "Active" : "Inactive"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Settings className="w-5 h-5 text-indigo-400" />
                    <div>
                      <p className="text-gray-400 text-sm">Join Type</p>
                      <div className="flex items-center space-x-2">
                        {getJoinTypeIcon(squad.joinType)}
                        <p className="text-white font-medium">
                          {getJoinTypeLabel(squad.joinType)}
                        </p>
                      </div>
                      <p className="text-gray-500 text-xs mt-1">
                        {getJoinTypeDescription(squad.joinType)}
                      </p>
                    </div>
                  </div>

                  {stats && (
                    <>
                      <div className="flex items-center space-x-3">
                        <Target className="w-5 h-5 text-indigo-400" />
                        <div>
                          <p className="text-gray-400 text-sm">
                            Available Slots
                          </p>
                          <p className="text-white font-medium">
                            {stats.availableSlots}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Clock className="w-5 h-5 text-orange-400" />
                        <div>
                          <p className="text-gray-400 text-sm">Days Active</p>
                          <p className="text-white font-medium">
                            {stats.daysSinceCreated}
                          </p>
                        </div>
                      </div>

                      {/* Squad Division Information */}
                      {stats.squadDivision && (
                        <div className="flex items-center space-x-3">
                          <Trophy className="w-5 h-5 text-yellow-400" />
                          <div>
                            <p className="text-gray-400 text-sm">
                              Squad Division
                            </p>
                            <div className="flex items-center space-x-2">
                              <DivisionCoinImage
                                division={
                                  (squad.division as SquadDivision) ||
                                  (stats.squadDivision.name as SquadDivision) ||
                                  "SILVER"
                                }
                                size={24}
                              />
                              <p className="text-white font-medium">
                                {getDivisionNameFromEnum(
                                  stats.squadDivision.name
                                )}
                              </p>
                            </div>
                            <p className="text-gray-500 text-xs mt-1">
                              {stats.squadDivision.currentBountyCoins || 0}{" "}
                              Bounty Coins
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {squad.description && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <h3 className="text-lg font-medium text-white mb-3">
                    Description
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {squad.description}
                  </p>
                </div>
              )}
            </motion.div>

            {/* Squad Division Progress Section */}
            {stats?.squadDivision && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-gray-800 rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">
                    Squad Division Progress
                  </h2>
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    <span className="text-yellow-400 font-medium">
                      {getDivisionNameFromEnum(stats.squadDivision.name)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Current Status */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12">
                        <DivisionCoinImage
                          division={
                            (squad.division as SquadDivision) ||
                            (stats.squadDivision.name as SquadDivision) ||
                            "SILVER"
                          }
                          size={48}
                          showGlow={true}
                        />
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">
                          Current Squad Division
                        </p>
                        <p className="text-white font-medium text-lg">
                          {getDivisionNameFromEnum(stats.squadDivision.name)}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {stats.squadDivision.currentBountyCoins || 0} Bounty
                          Coins
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Target className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-gray-400 text-sm">Progress</p>
                        <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(
                                stats.squadDivision.progress || 0,
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                        <p className="text-gray-500 text-xs mt-1">
                          {Math.min(
                            stats.squadDivision.progress || 0,
                            100
                          ).toFixed(1)}
                          % to next division
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Squad Division Stats */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="text-gray-400 text-sm">Protection</p>
                        <p className="text-white font-medium">
                          {stats.squadDivision.protectionCount || 0} remaining
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Star className="w-5 h-5 text-yellow-400" />
                      <div>
                        <p className="text-gray-400 text-sm">Upgrade Status</p>
                        <p
                          className={`font-medium ${
                            stats.squadDivision.canUpgrade
                              ? "text-green-400"
                              : "text-gray-400"
                          }`}
                        >
                          {stats.squadDivision.canUpgrade
                            ? "Ready to Upgrade"
                            : "Not Ready"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-orange-400" />
                      <div>
                        <p className="text-gray-400 text-sm">
                          Consecutive Losses
                        </p>
                        <p className="text-white font-medium">
                          {stats.squadDivision.consecutiveLosses || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Squad Division Rules Info */}
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <h3 className="text-lg font-medium text-white mb-3">
                    Squad Division Rules
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <p className="text-gray-300">
                        <strong>Upgrade:</strong> Win matches to earn bounty
                        coins and progress to higher divisions.
                      </p>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <p className="text-gray-300">
                        <strong>Protection:</strong> You have{" "}
                        {stats.squadDivision.protectionCount || 0} protection(s)
                        against demotion.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Members Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800 rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Members</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>
                    {squad.members ? squad.members.length : 0}/
                    {squad.maxMembers}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {squad.members &&
                  squad.members.map((member, index) => (
                    <div
                      key={member._id}
                      className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          {member.avatar ? (
                            <Image
                              src={member.avatar}
                              alt={member.name}
                              width={48}
                              height={48}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                              <User className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          {member._id === squad.leader._id && (
                            <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                              <Crown className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="text-white font-medium">
                              {member.name}
                            </p>
                            {member._id === squad.leader._id && (
                              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                                Leader
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm">
                            {member.email}
                          </p>
                        </div>
                      </div>

                      {isUserLeader() && member._id !== squad.leader._id && (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleTransferLeadership(member._id)}
                            disabled={transferLoadingId === member._id}
                            className="text-yellow-400 hover:text-yellow-300 transition-colors disabled:opacity-50"
                            title="Transfer leadership to this member"
                          >
                            {transferLoadingId === member._id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400" />
                            ) : (
                              <Crown className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleRemoveMember(member._id)}
                            disabled={memberActionLoading === member._id}
                            className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                            title="Remove member"
                          >
                            {memberActionLoading === member._id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400" />
                            ) : (
                              <UserMinus className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              {squad.members && squad.members.length < squad.maxMembers && (
                <div className="mt-6 p-4 border-2 border-dashed border-gray-600 rounded-lg text-center">
                  <UserPlus className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400">
                    {squad.maxMembers - squad.members.length} slot(s) available
                  </p>
                  {isUserLeader() && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <input
                        type="text"
                        value={addMemberId}
                        onChange={(e) => setAddMemberId(e.target.value)}
                        placeholder="Enter user ID to add"
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                      />
                      <button
                        onClick={handleAddMember}
                        disabled={addMemberLoading || !addMemberId.trim()}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {addMemberLoading ? "Adding..." : "Add Member"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            {/* Pending Applications Section (for Squad Leaders) */}
            {isUserLeader() && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-800 rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">
                    Pending Applications
                  </h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <UserCheck className="w-4 h-4" />
                    <span>Review Applications</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-gray-300">
                    Review and respond to applications from players who want to
                    join your squad.
                  </p>

                  <button
                    onClick={() =>
                      router.push(`/squads/${squadId}/applications`)
                    }
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    View Applications
                  </button>
                </div>
              </motion.div>
            )}

            {/* User's Applications Section */}
            {!isUserLeader() && !isUserMember() && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gray-800 rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">
                    My Applications
                  </h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <UserCheck className="w-4 h-4" />
                    <span>Track Your Applications</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-gray-300">
                    View the status of your applications to this squad.
                  </p>

                  <button
                    onClick={() =>
                      router.push(`/squads/user/${user?.id}/applications`)
                    }
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    View My Applications
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Bounty Coins Summary (Одоогийн үлдэгдэл / Нийт олсон / Нийт зарцуулсан) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.18 }}
              className="bg-gray-800 rounded-lg p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Bounty Coins
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {/* Одоогийн үлдэгдэл */}
                <div className="p-4 rounded-lg bg-gray-700/70">
                  <p className="text-sm text-gray-300 mb-2">
                    Одоогийн үлдэгдэл
                  </p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {(
                          bountySummary?.currentBountyCoins ??
                          stats?.squadDivision?.currentBountyCoins ??
                          0
                        ).toLocaleString()}{" "}
                        BC
                      </p>
                      <p className="text-xs text-gray-300 mt-1">
                        {stats?.squadDivision?.displayName || "Division"} Coin
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        ≈{" "}
                        {toMNT(
                          bountySummary?.currentBountyCoins ??
                            stats?.squadDivision?.currentBountyCoins ??
                            0
                        ).toLocaleString()}
                        ₮
                      </p>
                    </div>
                    <DivisionCoinImage
                      division={
                        (squad.division as SquadDivision) ||
                        (stats?.squadDivision?.name as SquadDivision) ||
                        "SILVER"
                      }
                      size={28}
                      showGlow={true}
                    />
                  </div>
                </div>

                {/* Нийт олсон */}
                <div className="p-4 rounded-lg bg-gray-700/70">
                  <p className="text-sm text-gray-300 mb-2">Нийт олсон</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {(bountySummary?.totalEarned ?? 0).toLocaleString()} BC
                      </p>
                      <p className="text-xs text-gray-300 mt-1">
                        {stats?.squadDivision?.displayName || "Division"} Coin
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        ≈{" "}
                        {toMNT(
                          bountySummary?.totalEarned ?? 0
                        ).toLocaleString()}
                        ₮
                      </p>
                    </div>
                    <DivisionCoinImage
                      division={
                        (squad.division as SquadDivision) ||
                        (stats?.squadDivision?.name as SquadDivision) ||
                        "SILVER"
                      }
                      size={28}
                      showGlow={false}
                    />
                  </div>
                </div>

                {/* Нийт зарцуулсан */}
                <div className="p-4 rounded-lg bg-gray-700/70">
                  <p className="text-sm text-gray-300 mb-2">Нийт зарцуулсан</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {(bountySummary?.totalSpent ?? 0).toLocaleString()} BC
                      </p>
                      <p className="text-xs text-gray-300 mt-1">
                        {stats?.squadDivision?.displayName || "Division"} Coin
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        ≈{" "}
                        {toMNT(bountySummary?.totalSpent ?? 0).toLocaleString()}
                        ₮
                      </p>
                    </div>
                    <DivisionCoinImage
                      division={
                        (squad.division as SquadDivision) ||
                        (stats?.squadDivision?.name as SquadDivision) ||
                        "SILVER"
                      }
                      size={28}
                      showGlow={false}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Squad Stats */}
            {stats && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-800 rounded-lg p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4">
                  Squad Stats
                </h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Member Capacity</span>
                      <span className="text-white">
                        {stats.memberPercentage
                          ? stats.memberPercentage.toFixed(0)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${
                            stats.memberPercentage ? stats.memberPercentage : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-700 rounded-lg">
                      <p className="text-2xl font-bold text-white">
                        {stats.totalMembers || 0}
                      </p>
                      <p className="text-gray-400 text-sm">Members</p>
                    </div>
                    <div className="text-center p-3 bg-gray-700 rounded-lg">
                      <p className="text-2xl font-bold text-white">
                        {stats.availableSlots || 0}
                      </p>
                      <p className="text-gray-400 text-sm">Available</p>
                    </div>
                  </div>

                  <div className="text-center p-3 bg-gray-700 rounded-lg">
                    <p className="text-2xl font-bold text-white">
                      {stats.daysSinceCreated || 0}
                    </p>
                    <p className="text-gray-400 text-sm">Days Active</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Squad Division Stats */}
            {stats?.squadDivision && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Trophy className="w-5 h-5 mr-2" />
                  {getDivisionNameFromEnum(stats.squadDivision.name)}
                </h3>

                <div className="space-y-4">
                  {/* Bounty Coins */}
                  <div className="text-center p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                    <div className="flex justify-center mb-2">
                      <DivisionCoinImage
                        division={
                          (squad.division as SquadDivision) ||
                          (stats.squadDivision.name as SquadDivision) ||
                          "SILVER"
                        }
                        size={32}
                        showGlow={true}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-3xl font-bold text-white">
                        {(
                          bountySummary?.currentBountyCoins ??
                          stats.squadDivision.currentBountyCoins ??
                          0
                        ).toLocaleString()}{" "}
                        BC
                      </p>
                      <p className="text-white/80 text-xs">
                        ≈{" "}
                        {toMNT(
                          bountySummary?.currentBountyCoins ??
                            stats.squadDivision.currentBountyCoins ??
                            0
                        ).toLocaleString()}
                        ₮
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white/80">Progress</span>
                      <span className="text-white font-semibold">
                        {Math.min(
                          stats.squadDivision.progress || 0,
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-3">
                      <div
                        className="bg-yellow-400 h-3 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            stats.squadDivision.progress || 0,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Protection & Losses */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-2 bg-green-500/20 rounded-lg">
                      <p className="text-lg font-bold text-white">
                        {stats.squadDivision.protectionCount || 0}
                      </p>
                      <p className="text-white/80 text-xs">Protections</p>
                    </div>
                    <div className="text-center p-2 bg-red-500/20 rounded-lg">
                      <p className="text-lg font-bold text-white">
                        {stats.squadDivision.consecutiveLosses || 0}
                      </p>
                      <p className="text-white/80 text-xs">
                        Consecutive Losses
                      </p>
                    </div>
                  </div>

                  {/* Upgrade Button */}
                  {stats.squadDivision.canUpgrade && isUserLeader() && (
                    <button
                      onClick={handleUpgradeDivision}
                      disabled={upgradeLoading}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Star className="w-4 h-4" />
                      <span>
                        {upgradeLoading
                          ? "Upgrading..."
                          : `Upgrade to ${
                              squad.division === "SILVER" ? "Gold" : "Diamond"
                            } Division (${getUpgradeCost(
                              squad.division || "SILVER"
                            )} BC)`}
                      </span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Squad Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Edit Squad</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditSquad} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Squad Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Squad Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter squad name"
                    required
                  />
                </div>

                {/* Squad Tag */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Squad Tag
                  </label>
                  <input
                    type="text"
                    name="tag"
                    value={editForm.tag}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                    placeholder="TAG"
                    maxLength={10}
                    required
                  />
                </div>

                {/* Game */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Game
                  </label>
                  <input
                    type="text"
                    name="game"
                    value="Mobile Legends: Bang Bang"
                    readOnly
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    All squads are for Mobile Legends: Bang Bang
                  </p>
                </div>

                {/* Max Members */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Members
                  </label>
                  <select
                    name="maxMembers"
                    value={editForm.maxMembers}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={5}>5</option>
                    <option value={6}>6</option>
                    <option value={7}>7</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter squad description..."
                  maxLength={500}
                />
              </div>

              {/* Join Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Join Type
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.values(SquadJoinType).map((joinType) => (
                    <button
                      key={joinType}
                      type="button"
                      onClick={() => handleJoinTypeChange(joinType)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        editForm.joinType === joinType
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-gray-600 bg-gray-700 hover:border-gray-500"
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        {getJoinTypeIcon(joinType)}
                        <span className="text-sm font-medium text-white">
                          {getJoinTypeLabel(joinType)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 text-left">
                        {getJoinTypeDescription(joinType)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={editForm.isActive}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium text-gray-300"
                >
                  Squad is active
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {editLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">
              Delete Squad
            </h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete &quot;{squad.name}&quot;? This
              action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSquad}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                Withdraw Bounty Coins
              </h3>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Amount (Coins)
                </label>
                <input
                  type="number"
                  min={1}
                  max={
                    bountySummary?.currentBountyCoins ??
                    stats?.squadDivision?.currentBountyCoins ??
                    0
                  }
                  value={withdrawForm.amountCoins === 0 ? "" : withdrawForm.amountCoins}
                  onChange={(e) =>
                    setWithdrawForm((p) => ({
                      ...p,
                      amountCoins: e.target.value === "" ? 0 : parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  ≈ {toMNT(withdrawForm.amountCoins || 0).toLocaleString()}₮
                </p>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={withdrawForm.bankName}
                  onChange={(e) =>
                    setWithdrawForm((p) => ({ ...p, bankName: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none"
                  placeholder="e.g., Khan Bank"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">IBAN</label>
                <input
                  type="text"
                  value={withdrawForm.iban}
                  onChange={(e) =>
                    setWithdrawForm((p) => ({ ...p, iban: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none"
                  placeholder="IBAN / Account number"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitWithdraw}
                  disabled={withdrawSubmitting}
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {withdrawSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FaCoins className="w-4 h-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Apply to Squad Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                Apply to Join Squad
              </h3>
              <button
                onClick={() => setShowApplyModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-300">
                This squad requires an application. Please submit your
                application below.
              </p>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                  Message (Optional)
                </label>
                <textarea
                  value={applicationMessage}
                  onChange={(e) => setApplicationMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell the squad leader why you want to join..."
                  maxLength={500}
                />
                <p className="text-gray-500 text-xs text-right">
                  {applicationMessage.length}/500 characters
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyToSquad}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4 mr-2" />
                      Submit Application
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Buy Bounty Coins Modal */}
      {showBuyBountyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                Buy Bounty Coins
              </h3>
              <button
                onClick={() => setShowBuyBountyModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Step 1: Select Amount */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-white">1. Select Amount</h4>
                
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300">
                    Amount of Bounty Coins
                  </label>

                  {/* Quick amount buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    {[50, 100, 200, 250, 500, 750].map((amount) => (
                      <button
                        key={amount}
                        onClick={() =>
                          setBuyBountyForm({
                            amount,
                            customAmount: "",
                          })
                        }
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          buyBountyForm.amount === amount &&
                          buyBountyForm.customAmount === ""
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        {amount} BC
                      </button>
                    ))}
                  </div>

                  {/* Custom amount input */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Or enter custom amount
                    </label>
                    <input
                      type="number"
                      value={buyBountyForm.customAmount}
                      onChange={(e) => {
                        const value = e.target.value;
                        setBuyBountyForm({
                          customAmount: value,
                          amount: value ? parseInt(value) : 50,
                        });
                      }}
                      min="1"
                      max="10000"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter custom amount..."
                    />
                  </div>

                  {/* Estimated cost */}
                  {divisionInfo && (
                    <div className="p-3 bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-300">
                        Estimated cost: ~
                        {Math.round(
                          (buyBountyForm.amount /
                            divisionInfo[0]?.bountyCoinAmount || 50) *
                            (divisionInfo[0]?.bountyCoinPrice || 5000)
                        ).toLocaleString()}{" "}
                        ₮
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Based on current division pricing
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Bank Transfer Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-white">2. Bank Transfer</h4>
                
                <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-white font-medium">Хас банк</span>
                    </div>
                    <div className="pl-4 space-y-2">
                      <div>
                        <span className="text-gray-400 text-sm">Дансны дугаар:</span>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-mono text-lg">380032005005896566</p>
                          <button
                            onClick={copyAccountNumber}
                            className="p-1 hover:bg-gray-600 rounded transition-colors"
                            title="Copy account number"
                          >
                            {accountNumberCopied ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400 text-sm">Эзэмшигч:</span>
                        <p className="text-white">Өсөхбаяр</p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-sm">Дүн:</span>
                        <p className="text-green-400 font-semibold">
                          {divisionInfo && Math.round(
                            (buyBountyForm.amount /
                              divisionInfo[0]?.bountyCoinAmount || 50) *
                              (divisionInfo[0]?.bountyCoinPrice || 5000)
                          ).toLocaleString()} ₮
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Transaction Reference */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-white">3. Transaction Reference</h4>
                
                <div className="space-y-3">
                  <div className="p-3 bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-300 mb-2">
                      Гүйлгээний утга дээр дараах мэдээллийг бичнэ үү:
                    </p>
                    <div className="bg-gray-800 p-3 rounded border">
                      <code className="text-green-400 font-mono text-sm">
                        {squad?.name} [{squad?.tag}]
                      </code>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowBuyBountyModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBuyBountyCoins}
                  disabled={buyBountySubmitting || buyBountyForm.amount <= 0}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {buyBountySubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Recharging...
                    </>
                  ) : (
                    <>
                      <FaCoins className="w-4 h-4 mr-2" />
                      Recharge
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Match History Section */}
      {squad && (
        <div className="mt-6">
          <MatchHistory squadId={squad._id} />
        </div>
      )}
    </div>
  );
}
