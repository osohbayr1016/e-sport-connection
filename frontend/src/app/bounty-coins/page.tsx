"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import PageTransition from "../components/PageTransition";
import { useAuth } from "../contexts/AuthContext";
import { FaCoins, FaArrowUp, FaArrowDown, FaHistory } from "react-icons/fa";
import { SquadDivision } from "../../types/division";
import DivisionCoinImage from "../../components/DivisionCoinImage";
import { API_ENDPOINTS } from "../../config/api";

interface BountyCoinData {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  transactions: Array<{
    type: "earn" | "spend" | "purchase" | "withdraw";
    amount: number;
    description: string;
    timestamp: string;
  }>;
}

export default function BountyCoinsPage() {
  const { user } = useAuth();
  const [bountyCoinData, setBountyCoinData] = useState<BountyCoinData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [userDivision, setUserDivision] = useState<SquadDivision>(
    SquadDivision.GOLD
  );

  const fetchBountyCoinData = useCallback(async () => {
    try {
      const response = await fetch(
        API_ENDPOINTS.BOUNTY_COINS.BALANCE(user?.id || ""),
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBountyCoinData(data.data);
          // Set user division from bounty coin data if available
          if (data.data.division) {
            setUserDivision(data.data.division);
          }
        } else {
          // API returned error, use fallback data
          setBountyCoinData({
            balance: 0,
            totalEarned: 0,
            totalSpent: 0,
            transactions: [],
          });
        }
      } else {
        // API not available, use fallback data
        setBountyCoinData({
          balance: 0,
          totalEarned: 0,
          totalSpent: 0,
          transactions: [],
        });
      }
    } catch (error) {
      console.error("Error fetching bounty coin data:", error);
      // Network error, use fallback data
      setBountyCoinData({
        balance: 0,
        totalEarned: 0,
        totalSpent: 0,
        transactions: [],
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchBountyCoinData();
    }
  }, [user, fetchBountyCoinData]);

  const formatCurrency = (amount: number) => {
    return `${amount} BC`;
  };

  const formatMNT = (amount: number) => {
    return `${amount.toLocaleString()}₮`;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "earn":
        return <FaArrowUp className="text-green-500" />;
      case "spend":
        return <FaArrowDown className="text-red-500" />;
      case "purchase":
        return <FaCoins className="text-blue-500" />;
      case "withdraw":
        return <FaArrowDown className="text-orange-500" />;
      default:
        return <FaCoins className="text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black flex items-center justify-center">
          <div className="text-white text-xl">Уншиж байна...</div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black">
        {/* Header */}
        <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center space-x-4">
              <div className="bg-yellow-500/20 p-3 rounded-full">
                <DivisionCoinImage
                  division={userDivision}
                  size={48}
                  showGlow={true}
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Боунти Койн</h1>
                <p className="text-gray-300">
                  Тэмцээний шагналаа удирдаж, багийнхаа дэвшлийг хянана уу
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Balance Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-400 text-sm font-medium">
                    Одоогийн үлдэгдэл
                  </p>
                  <p className="text-white text-3xl font-bold">
                    {bountyCoinData
                      ? formatCurrency(bountyCoinData.balance)
                      : "0 BC"}
                  </p>
                </div>
                <div className="relative">
                  <DivisionCoinImage division={userDivision} size={48} />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
                </div>
              </div>
              <p className="text-yellow-300 text-sm mt-2">
                ≈{" "}
                {bountyCoinData
                  ? formatMNT(bountyCoinData.balance * 200)
                  : "0₮"}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-400 text-sm font-medium">
                    Нийт олсон
                  </p>
                  <p className="text-white text-3xl font-bold">
                    {bountyCoinData
                      ? formatCurrency(bountyCoinData.totalEarned)
                      : "0 BC"}
                  </p>
                </div>
                <div className="relative">
                  <DivisionCoinImage
                    division={userDivision}
                    size={48}
                    className="opacity-80"
                  />
                  <FaArrowUp className="absolute -top-1 -right-1 text-green-400 text-lg" />
                </div>
              </div>
              <p className="text-green-300 text-sm mt-2">
                ≈{" "}
                {bountyCoinData
                  ? formatMNT(bountyCoinData.totalEarned * 200)
                  : "0₮"}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-400 text-sm font-medium">
                    Нийт зарцуулсан
                  </p>
                  <p className="text-white text-3xl font-bold">
                    {bountyCoinData
                      ? formatCurrency(bountyCoinData.totalSpent)
                      : "0 BC"}
                  </p>
                </div>
                <div className="relative">
                  <DivisionCoinImage
                    division={userDivision}
                    size={48}
                    className="opacity-60"
                  />
                  <FaArrowDown className="absolute -top-1 -right-1 text-blue-400 text-lg" />
                </div>
              </div>
              <p className="text-blue-300 text-sm mt-2">
                ≈{" "}
                {bountyCoinData
                  ? formatMNT(bountyCoinData.totalSpent * 200)
                  : "0₮"}
              </p>
            </div>
          </motion.div>

          {/* Hero Section with Bounty Coin Image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-yellow-500/10 border border-yellow-500/20 rounded-xl p-8 mb-8 text-center"
          >
            <div className="flex justify-center mb-6">
              <motion.div
                className="relative"
                animate={{
                  rotateY: [0, 360],
                  y: [0, -20, 0],
                }}
                transition={{
                  rotateY: {
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                  },
                  y: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }}
                style={{
                  transformStyle: "preserve-3d",
                }}
              >
                <DivisionCoinImage
                  division={userDivision}
                  size={120}
                  className="rounded-full"
                />
                <motion.div
                  className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              🎯 Таны тэмцээний шагналууд хүлээж байна!
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Таны тоглосон тоглолт бүр, хүрсэн ялалт бүр, давсан сорилт бүр
              таныг эдгээр үнэ цэнэтэй Боунти Койн-ийг олоход ойртуулна.
              Тэдгээрийг ашиглан багийнхаа түвшинг ахиулж, эд зүйлс худалдан авч
              эсвэл бэлэн мөнгөнд хөрвүүлээрэй!
            </p>
          </motion.div>

          {/* Tabs */}
          <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 mb-8">
            <div className="flex space-x-1 p-2">
              {[
                { id: "overview", label: "Ерөнхий", icon: FaCoins },
                { id: "transactions", label: "Гүйлгээ", icon: FaHistory },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <tab.icon className="text-sm" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-6">
            {activeTab === "overview" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Боунти Койн хэрхэн ажилладаг вэ
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-2">
                        <motion.div
                          animate={{
                            rotateY: [0, 360],
                            y: [0, -3, 0],
                          }}
                          transition={{
                            rotateY: {
                              duration: 5,
                              repeat: Infinity,
                              ease: "linear",
                            },
                            y: {
                              duration: 4,
                              repeat: Infinity,
                              ease: "easeInOut",
                            },
                          }}
                          style={{
                            transformStyle: "preserve-3d",
                          }}
                        >
                          <DivisionCoinImage
                            division={userDivision}
                            size={24}
                          />
                        </motion.div>
                        <h4 className="text-green-400 font-medium">
                          🏆 Тоглолт хожих
                        </h4>
                      </div>
                      <p className="text-gray-300 text-sm">
                        Тэмцээний тоглолтыг хожвол тоглогч бүрт 50 Боунти Койн
                      </p>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-2">
                        <motion.div
                          animate={{
                            rotateY: [0, 360],
                            y: [0, -3, 0],
                          }}
                          transition={{
                            rotateY: {
                              duration: 5,
                              repeat: Infinity,
                              ease: "linear",
                            },
                            y: {
                              duration: 4,
                              repeat: Infinity,
                              ease: "easeInOut",
                            },
                          }}
                          style={{
                            transformStyle: "preserve-3d",
                          }}
                        >
                          <DivisionCoinImage
                            division={userDivision}
                            size={24}
                            className="opacity-60"
                          />
                        </motion.div>
                        <h4 className="text-red-400 font-medium">
                          💔 Тоглолт хожигдох
                        </h4>
                      </div>
                      <p className="text-gray-300 text-sm">
                        Тоглогч бүрт 25 Боунти Койн алдагдана (хамгийн бага 0)
                      </p>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-2">
                        <motion.div
                          animate={{
                            rotateY: [0, 360],
                            y: [0, -3, 0],
                          }}
                          transition={{
                            rotateY: {
                              duration: 5,
                              repeat: Infinity,
                              ease: "linear",
                            },
                            y: {
                              duration: 4,
                              repeat: Infinity,
                              ease: "easeInOut",
                            },
                          }}
                          style={{
                            transformStyle: "preserve-3d",
                          }}
                        >
                          <DivisionCoinImage
                            division={userDivision}
                            size={24}
                          />
                        </motion.div>
                        <h4 className="text-blue-400 font-medium">
                          💰 Худалдан авах
                        </h4>
                      </div>
                      <p className="text-gray-300 text-sm">
                        10 Боунти Койн = 2,000₮ (1 BC = 2000₮)
                      </p>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-2">
                        <motion.div
                          animate={{
                            rotateY: [0, 360],
                            y: [0, -3, 0],
                          }}
                          transition={{
                            rotateY: {
                              duration: 5,
                              repeat: Infinity,
                              ease: "linear",
                            },
                            y: {
                              duration: 4,
                              repeat: Infinity,
                              ease: "easeInOut",
                            },
                          }}
                          style={{
                            transformStyle: "preserve-3d",
                          }}
                        >
                          <DivisionCoinImage
                            division={userDivision}
                            size={24}
                          />
                        </motion.div>
                        <h4 className="text-purple-400 font-medium">
                          📈 Багийн түвшин ахиулах
                        </h4>
                      </div>
                      <p className="text-gray-300 text-sm">
                        Койн зарцуулж багийн туршлага болон түвшинг ахиулна
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-6">
                  <h4 className="text-white font-semibold mb-3">
                    Хурдан үйлдлүүд
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors">
                      Койн худалдах
                    </button>
                    <button className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition-colors">
                      Багийн түвшин ахиулах
                    </button>
                    <button className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg transition-colors">
                      МНТ болгон хөрвүүлэх
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "transactions" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Гүйлгээний түүх
                  </h3>
                  {bountyCoinData && bountyCoinData.transactions.length > 0 ? (
                    <div className="space-y-3">
                      {bountyCoinData.transactions
                        .slice(0, 10)
                        .map((transaction, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <motion.div
                                  animate={{
                                    rotateY: [0, 360],
                                    y: [0, -2, 0],
                                  }}
                                  transition={{
                                    rotateY: {
                                      duration: 6,
                                      repeat: Infinity,
                                      ease: "linear",
                                    },
                                    y: {
                                      duration: 5,
                                      repeat: Infinity,
                                      ease: "easeInOut",
                                    },
                                  }}
                                  style={{
                                    transformStyle: "preserve-3d",
                                  }}
                                >
                                  <DivisionCoinImage
                                    division={userDivision}
                                    size={32}
                                  />
                                </motion.div>
                                {getTransactionIcon(transaction.type)}
                              </div>
                              <div>
                                <p className="text-white font-medium">
                                  {transaction.description}
                                </p>
                                <p className="text-gray-400 text-sm">
                                  {new Date(
                                    transaction.timestamp
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div
                              className={`text-right ${
                                transaction.amount > 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              <p className="font-semibold">
                                {transaction.amount > 0 ? "+" : ""}
                                {formatCurrency(transaction.amount)}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="mb-4">
                        <motion.div
                          animate={{
                            rotateY: [0, 360],
                            y: [0, -5, 0],
                          }}
                          transition={{
                            rotateY: {
                              duration: 4,
                              repeat: Infinity,
                              ease: "linear",
                            },
                            y: {
                              duration: 3,
                              repeat: Infinity,
                              ease: "easeInOut",
                            },
                          }}
                          style={{
                            transformStyle: "preserve-3d",
                          }}
                        >
                          <DivisionCoinImage
                            division={userDivision}
                            size={64}
                            className="rounded-full mx-auto opacity-50"
                          />
                        </motion.div>
                      </div>
                      <p className="text-gray-400">
                        Одоогоор гүйлгээ байхгүй байна
                      </p>
                      <p className="text-gray-500 text-sm mt-2">
                        Тэмцээнүүдэд оролцож анхны Боунти Койн-оо олж эхлээрэй!
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
