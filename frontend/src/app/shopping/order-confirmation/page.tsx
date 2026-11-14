"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Package,
  Truck,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  Clock,
  ArrowLeft,
  Download,
  Share2,
  Eye,
  RefreshCw,
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
  shippingAddress: {
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    city: string;
    district: string;
    postalCode: string;
    notes?: string;
  };
  createdAt: string;
  estimatedDelivery: string;
  trackingNumber?: string;
}

const statusSteps = [
  { key: "pending", label: "Захиалга өгөгдсөн", icon: Package },
  { key: "confirmed", label: "Баталгаажсан", icon: CheckCircle },
  { key: "shipped", label: "Хүргэлтэнд гарсан", icon: Truck },
  { key: "delivered", label: "Хүргэгдсэн", icon: CheckCircle },
];

export default function OrderConfirmationPage() {
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        // TODO: Implement API call to fetch order by ID from URL params
        // const response = await fetch(`/api/orders/${orderId}`);
        // const data = await response.json();
        // setOrder(data.order);
        
        setOrder(null);
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-400";
      case "confirmed":
        return "text-blue-400";
      case "shipped":
        return "text-purple-400";
      case "delivered":
        return "text-green-400";
      case "cancelled":
        return "text-red-400";
      default:
        return "text-gray-400";
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "long",
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
          <p className="text-gray-300 mb-6">Захиалгын мэдээлэл үзэхийн тулд эхлээд нэвтэрнэ үү</p>
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
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-700 rounded w-1/3 mb-8"></div>
              <div className="space-y-4">
                <div className="h-32 bg-gray-700 rounded"></div>
                <div className="h-64 bg-gray-700 rounded"></div>
                <div className="h-48 bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Захиалга олдсонгүй</h1>
            <p className="text-gray-300 mb-6">Захиалгын дугаар буруу эсвэл захиалга байхгүй байна</p>
            <Link href="/shopping/orders">
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg">
                Захиалгын түүх үзэх
              </button>
            </Link>
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
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/shopping/orders">
              <button className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                <CheckCircle className="w-10 h-10 text-green-400" />
                Захиалга амжилттай
              </h1>
              <p className="text-gray-300 mt-2">
                Захиалгын дугаар: <span className="text-purple-400 font-semibold">{order.orderNumber}</span>
              </p>
            </div>
          </div>

          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-green-500/20 border border-green-500/30 rounded-2xl p-6 mb-8"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <div>
                <h2 className="text-xl font-bold text-white">Захиалга амжилттай хүлээн авлаа!</h2>
                <p className="text-green-300">
                  Таны захиалга баталгаажсан бөгөөд бэлтгэлд орсон байна. 
                  Хүргэлтийн мэдээлэл имэйлээр илгээх болно.
                </p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Status */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6"
              >
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-400" />
                  Захиалгын төлөв
                </h2>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className={`p-3 rounded-full bg-white/10 ${getStatusColor(order.status)}`}>
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{getStatusLabel(order.status)}</h3>
                    <p className="text-gray-400 text-sm">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="space-y-3">
                  {statusSteps.map((step, index) => {
                    const Icon = step.icon;
                    const isCompleted = statusSteps.findIndex(s => s.key === order.status) >= index;
                    const isCurrent = step.key === order.status;
                    
                    return (
                      <div key={step.key} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isCompleted 
                            ? "bg-green-500 text-white" 
                            : isCurrent
                            ? "bg-blue-500 text-white"
                            : "bg-gray-600 text-gray-400"
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`text-sm ${
                          isCompleted || isCurrent ? "text-white" : "text-gray-400"
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {order.trackingNumber && (
                  <div className="mt-6 p-4 bg-white/5 rounded-lg">
                    <p className="text-gray-300 text-sm mb-2">Албадалтын дугаар:</p>
                    <p className="text-white font-semibold">{order.trackingNumber}</p>
                  </div>
                )}
              </motion.div>

              {/* Order Items */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6"
              >
                <h2 className="text-xl font-bold text-white mb-4">Захиалгын бараа</h2>
                
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{item.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <img
                            src={item.vendor.logo}
                            alt={item.vendor.name}
                            className="w-4 h-4 rounded-full"
                          />
                          <span className="text-gray-400 text-sm">{item.vendor.name}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-white font-semibold">
                          {item.price.toLocaleString()}₮
                        </p>
                        <p className="text-gray-400 text-sm">
                          {item.quantity} ширхэг
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Shipping Address */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6"
              >
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-400" />
                  Хүргэлтийн хаяг
                </h2>
                
                <div className="space-y-2">
                  <p className="text-white">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  </p>
                  <p className="text-gray-300">{order.shippingAddress.phone}</p>
                  <p className="text-gray-300">
                    {order.shippingAddress.city}, {order.shippingAddress.district}
                  </p>
                  <p className="text-gray-300">{order.shippingAddress.address}</p>
                  {order.shippingAddress.postalCode && (
                    <p className="text-gray-300">Шуудангийн код: {order.shippingAddress.postalCode}</p>
                  )}
                  {order.shippingAddress.notes && (
                    <p className="text-gray-300">Нэмэлт мэдээлэл: {order.shippingAddress.notes}</p>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              {/* Order Summary */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6"
              >
                <h2 className="text-xl font-bold text-white mb-4">Захиалгын дүн</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-300">
                    <span>Барааны дүн:</span>
                    <span>{order.subtotal.toLocaleString()}₮</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Хүргэлт:</span>
                    <span>{order.shipping.toLocaleString()}₮</span>
                  </div>
                  <div className="border-t border-white/20 pt-3">
                    <div className="flex justify-between text-white font-bold text-lg">
                      <span>Нийт дүн:</span>
                      <span>{order.total.toLocaleString()}₮</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-gray-300">
                    <span>Төлбөрийн арга:</span>
                    <span className="text-white">{order.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Төлбөрийн төлөв:</span>
                    <span className="text-green-400">Төлөгдсөн</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Хүлээгдэж буй хүргэлт:</span>
                    <span className="text-white">{formatDate(order.estimatedDelivery)}</span>
                  </div>
                </div>
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6"
              >
                <h2 className="text-xl font-bold text-white mb-4">Үйлдэл</h2>
                
                <div className="space-y-3">
                  <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" />
                    Баримт татах
                  </button>
                  
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
                    <Share2 className="w-4 h-4" />
                    Хуваалцах
                  </button>
                  
                  <Link href="/shopping/orders">
                    <button className="w-full bg-white/20 hover:bg-white/30 text-white py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
                      <Eye className="w-4 h-4" />
                      Бүх захиалга үзэх
                    </button>
                  </Link>
                  
                  <Link href="/shopping">
                    <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Дахин худалдаж авах
                    </button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
