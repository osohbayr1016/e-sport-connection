"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Search,
  Filter,
  Calendar,
  Eye,
  Download,
  RefreshCw,
  ArrowLeft,
  CheckCircle,
  Clock,
  Truck,
  X,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import Navigation from "../../components/Navigation";
import { useAuth } from "../../contexts/AuthContext";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  vendor: {
    id: string;
    name: string;
    logo: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentMethod: string;
  createdAt: string;
  estimatedDelivery: string;
  trackingNumber?: string;
}

const statusFilters = [
  { key: "all", label: "Бүгд" },
  { key: "pending", label: "Хүлээгдэж байна" },
  { key: "confirmed", label: "Баталгаажсан" },
  { key: "shipped", label: "Хүргэлтэнд гарсан" },
  { key: "delivered", label: "Хүргэгдсэн" },
  { key: "cancelled", label: "Цуцлагдсан" },
];

export default function OrderHistoryPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        // TODO: Implement API call to fetch user orders
        // const response = await fetch('/api/orders');
        // const data = await response.json();
        // setOrders(data.orders);
        
        setOrders([]);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "total-high":
        return b.total - a.total;
      case "total-low":
        return a.total - b.total;
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-400 bg-yellow-500/20";
      case "confirmed":
        return "text-blue-400 bg-blue-500/20";
      case "shipped":
        return "text-purple-400 bg-purple-500/20";
      case "delivered":
        return "text-green-400 bg-green-500/20";
      case "cancelled":
        return "text-red-400 bg-red-500/20";
      default:
        return "text-gray-400 bg-gray-500/20";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Хүлээгдэж байна";
      case "confirmed":
        return "Баталгаажсан";
      case "shipped":
        return "Хүргэлтэнд гарсан";
      case "delivered":
        return "Хүргэгдсэн";
      case "cancelled":
        return "Цуцлагдсан";
      default:
        return "Тодорхойгүй";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return Clock;
      case "confirmed":
        return CheckCircle;
      case "shipped":
        return Truck;
      case "delivered":
        return CheckCircle;
      case "cancelled":
        return X;
      default:
        return Package;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Navigation />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Нэвтрэх шаардлагатай</h1>
          <p className="text-gray-300 mb-6">Захиалгын түүх үзэхийн тулд эхлээд нэвтэрнэ үү</p>
          <Link href="/auth/login">
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg">
              Нэвтрэх
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-700 rounded w-1/3 mb-8"></div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/shopping">
              <button className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <Package className="w-10 h-10 text-purple-400" />
              Захиалгын түүх
            </h1>
          </div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8"
          >
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Захиалгын дугаар эсвэл барааны нэрээр хайх..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/20 text-white placeholder-gray-300 px-12 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white/20 text-white px-4 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {statusFilters.map((filter) => (
                  <option key={filter.key} value={filter.key} className="bg-gray-800">
                    {filter.label}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white/20 text-white px-4 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="newest" className="bg-gray-800">Шинэ захиалга</option>
                <option value="oldest" className="bg-gray-800">Хуучин захиалга</option>
                <option value="total-high" className="bg-gray-800">Үнэ: Ихээс бага</option>
                <option value="total-low" className="bg-gray-800">Үнэ: Багаас их</option>
              </select>
            </div>
          </motion.div>

          {/* Orders List */}
          <div className="space-y-6">
            {sortedOrders.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">
                  Захиалга олдсонгүй
                </h3>
                <p className="text-gray-400 mb-6">
                  Хайлтын нөхцөлөө өөрчилж дахин оролдоно уу
                </p>
                <Link href="/shopping">
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg">
                    Дэлгүүр рүү буцах
                  </button>
                </Link>
              </motion.div>
            ) : (
              sortedOrders.map((order, index) => {
                const StatusIcon = getStatusIcon(order.status);
                
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/15 transition-colors duration-200"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                      {/* Order Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <div className={`p-2 rounded-full ${getStatusColor(order.status)}`}>
                            <StatusIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-white font-semibold text-lg">
                              {order.orderNumber}
                            </h3>
                            <p className="text-gray-400 text-sm">
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </div>

                        {/* Items Preview */}
                        <div className="space-y-3">
                          {order.items.slice(0, 2).map((item) => (
                            <div key={item.id} className="flex items-center gap-3">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                              <div className="flex-1">
                                <h4 className="text-white font-medium">{item.name}</h4>
                                <div className="flex items-center gap-2">
                                  <img
                                    src={item.vendor.logo}
                                    alt={item.vendor.name}
                                    className="w-4 h-4 rounded-full"
                                  />
                                  <span className="text-gray-400 text-sm">{item.vendor.name}</span>
                                  <span className="text-gray-400 text-sm">•</span>
                                  <span className="text-gray-400 text-sm">{item.quantity} ширхэг</span>
                                </div>
                              </div>
                              <span className="text-white font-semibold">
                                {(item.price * item.quantity).toLocaleString()}₮
                              </span>
                            </div>
                          ))}
                          
                          {order.items.length > 2 && (
                            <p className="text-gray-400 text-sm">
                              +{order.items.length - 2} бараа
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div className="lg:w-64">
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-gray-300">
                            <span>Барааны дүн:</span>
                            <span>{order.subtotal.toLocaleString()}₮</span>
                          </div>
                          <div className="flex justify-between text-gray-300">
                            <span>Хүргэлт:</span>
                            <span>{order.shipping.toLocaleString()}₮</span>
                          </div>
                          <div className="border-t border-white/20 pt-2">
                            <div className="flex justify-between text-white font-semibold">
                              <span>Нийт:</span>
                              <span>{order.total.toLocaleString()}₮</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-gray-300 text-sm">
                            <span>Төлбөрийн арга:</span>
                            <span className="text-white">{order.paymentMethod}</span>
                          </div>
                          <div className="flex justify-between text-gray-300 text-sm">
                            <span>Төлбөрийн төлөв:</span>
                            <span className="text-green-400">Төлөгдсөн</span>
                          </div>
                          {order.trackingNumber && (
                            <div className="flex justify-between text-gray-300 text-sm">
                              <span>Албадалт:</span>
                              <span className="text-white">{order.trackingNumber}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Link href={`/shopping/order-confirmation?id=${order.id}`}>
                            <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
                              <Eye className="w-4 h-4" />
                              Дэлгэрэнгүй
                            </button>
                          </Link>
                          <button className="p-2 bg-white/20 hover:bg-white/30 text-gray-300 rounded-lg transition-colors duration-200">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Stats */}
          {sortedOrders.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6"
            >
              <h2 className="text-xl font-bold text-white mb-4">Захиалгын статистик</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{orders.length}</div>
                  <div className="text-gray-400 text-sm">Нийт захиалга</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {orders.filter(o => o.status === "delivered").length}
                  </div>
                  <div className="text-gray-400 text-sm">Хүргэгдсэн</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {orders.filter(o => o.status === "shipped").length}
                  </div>
                  <div className="text-gray-400 text-sm">Хүргэлтэнд</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {orders.reduce((sum, order) => sum + order.total, 0).toLocaleString()}₮
                  </div>
                  <div className="text-gray-400 text-sm">Нийт зарцуулсан</div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
