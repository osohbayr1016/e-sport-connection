"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Package,
  Truck,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  User,
  Building,
  Shield,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import Navigation from "../../components/Navigation";
import { useAuth } from "../../contexts/AuthContext";
import { useCart, CartItem, ShippingAddress } from "../../contexts/CartContext";

const paymentMethods = [
  { id: "card", name: "Банкны карт", icon: CreditCard },
  { id: "qpay", name: "QPay", icon: CreditCard },
  { id: "socialpay", name: "SocialPay", icon: CreditCard },
  { id: "cash", name: "Бэлнээр", icon: CreditCard },
];

const cities = [
  "Улаанбаатар",
  "Дархан",
  "Эрдэнэт",
  "Чойбалсан",
  "Мөрөн",
  "Ховд",
  "Увс",
  "Хөвсгөл",
  "Архангай",
  "Бусад",
];

export default function ShoppingCartPage() {
  const { user } = useAuth();
  const { state, updateQuantity, removeItem, clearCart, getVendorItems, getVendorTotal } = useCart();
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    district: "",
    postalCode: "",
    notes: "",
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);

  const shippingCost = 5000; // 5000₮ shipping cost
  const subtotal = state.totalPrice;
  const total = subtotal + shippingCost;

  const groupedByVendor = state.items.reduce((acc, item) => {
    if (!acc[item.vendor.id]) {
      acc[item.vendor.id] = {
        vendor: item.vendor,
        items: [],
        subtotal: 0,
      };
    }
    acc[item.vendor.id].items.push(item);
    acc[item.vendor.id].subtotal += item.price * item.quantity;
    return acc;
  }, {} as Record<string, { vendor: any; items: CartItem[]; subtotal: number }>);

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      alert("Захиалга өгөхийн тулд эхлээд нэвтэрнэ үү");
      return;
    }

    if (state.items.length === 0) {
      alert("Сагсанд бараа байхгүй байна");
      return;
    }

    if (!shippingAddress.firstName || !shippingAddress.lastName || !shippingAddress.phone || !shippingAddress.address) {
      alert("Хүргэлтийн мэдээлэл бөглөнө үү");
      return;
    }

    setIsProcessing(true);
    try {
      // Here you would process the order with your backend
      console.log("Processing order:", {
        items: state.items,
        shippingAddress,
        paymentMethod: selectedPaymentMethod,
        total,
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert("Захиалга амжилттай өгөгдлөө!");
      clearCart();
      // Redirect to order confirmation page
      window.location.href = "/shopping/order-confirmation";
    } catch (error) {
      console.error("Error processing order:", error);
      alert("Алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Navigation />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Нэвтрэх шаардлагатай</h1>
          <p className="text-gray-300 mb-6">Сагс үзэхийн тулд эхлээд нэвтэрнэ үү</p>
          <Link href="/auth/login">
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg">
              Нэвтрэх
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (state.items.length === 0) {
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
              <Link href="/shopping">
                <button className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </Link>
              <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                <ShoppingCart className="w-10 h-10 text-purple-400" />
                Миний сагс
              </h1>
            </div>

            {/* Empty Cart */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 text-center">
              <ShoppingCart className="w-24 h-24 text-gray-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-white mb-4">Сагс хоосон байна</h2>
              <p className="text-gray-300 mb-8">
                Худалдаж авах бараагаа сагсанд нэмээд үзээрэй
              </p>
              <Link href="/shopping">
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg transition-colors duration-200">
                  Дэлгүүр рүү буцах
                </button>
              </Link>
            </div>
          </motion.div>
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
              <ShoppingCart className="w-10 h-10 text-purple-400" />
              Миний сагс ({state.totalItems} бараа)
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {Object.values(groupedByVendor).map((vendorGroup) => (
                <motion.div
                  key={vendorGroup.vendor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl p-6"
                >
                  {/* Vendor Header */}
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/20">
                    <img
                      src={vendorGroup.vendor.logo}
                      alt={vendorGroup.vendor.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        {vendorGroup.vendor.name}
                        {vendorGroup.vendor.verified && <Shield className="w-4 h-4 text-blue-400" />}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {vendorGroup.items.length} бараа • {vendorGroup.subtotal.toLocaleString()}₮
                      </p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-4">
                    {vendorGroup.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        
                        <div className="flex-1">
                          <h4 className="text-white font-semibold mb-1">{item.name}</h4>
                          <p className="text-gray-400 text-sm mb-2">
                            {item.price.toLocaleString()}₮
                            {item.originalPrice && (
                              <span className="line-through ml-2">
                                {item.originalPrice.toLocaleString()}₮
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="p-1 bg-white/20 hover:bg-white/30 text-white rounded transition-colors duration-200"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-white font-semibold min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="p-1 bg-white/20 hover:bg-white/30 text-white rounded transition-colors duration-200"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="text-white font-semibold min-w-[6rem] text-right">
                          {(item.price * item.quantity).toLocaleString()}₮
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Checkout Sidebar */}
            <div className="space-y-6">
              {/* Order Summary */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6"
              >
                <h2 className="text-xl font-bold text-white mb-4">Захиалгын дүн</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-300">
                    <span>Барааны дүн:</span>
                    <span>{subtotal.toLocaleString()}₮</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Хүргэлт:</span>
                    <span>{shippingCost.toLocaleString()}₮</span>
                  </div>
                  <div className="border-t border-white/20 pt-3">
                    <div className="flex justify-between text-white font-bold text-lg">
                      <span>Нийт дүн:</span>
                      <span>{total.toLocaleString()}₮</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Боловсруулж байна...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Захиалга өгөх
                    </>
                  )}
                </button>
              </motion.div>

              {/* Shipping Address */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6"
              >
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-400" />
                  Хүргэлтийн хаяг
                </h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Нэр"
                      value={shippingAddress.firstName}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, firstName: e.target.value }))}
                      className="bg-white/10 text-white px-3 py-2 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      type="text"
                      placeholder="Овог"
                      value={shippingAddress.lastName}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, lastName: e.target.value }))}
                      className="bg-white/10 text-white px-3 py-2 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <input
                    type="tel"
                    placeholder="Утасны дугаар"
                    value={shippingAddress.phone}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-white/10 text-white px-3 py-2 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  
                  <select
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full bg-white/10 text-white px-3 py-2 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="" className="bg-gray-800">Хот сонгох</option>
                    {cities.map((city) => (
                      <option key={city} value={city} className="bg-gray-800">{city}</option>
                    ))}
                  </select>
                  
                  <input
                    type="text"
                    placeholder="Дүүрэг/Сум"
                    value={shippingAddress.district}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, district: e.target.value }))}
                    className="w-full bg-white/10 text-white px-3 py-2 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  
                  <textarea
                    placeholder="Дэлгэрэнгүй хаяг"
                    value={shippingAddress.address}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, address: e.target.value }))}
                    rows={3}
                    className="w-full bg-white/10 text-white px-3 py-2 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  
                  <input
                    type="text"
                    placeholder="Шуудангийн код (сонголттой)"
                    value={shippingAddress.postalCode}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                    className="w-full bg-white/10 text-white px-3 py-2 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  
                  <textarea
                    placeholder="Нэмэлт мэдээлэл (сонголттой)"
                    value={shippingAddress.notes}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                    className="w-full bg-white/10 text-white px-3 py-2 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </motion.div>

              {/* Payment Method */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6"
              >
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-green-400" />
                  Төлбөрийн арга
                </h2>
                
                <div className="space-y-3">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <label key={method.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors duration-200">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={selectedPaymentMethod === method.id}
                          onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                          className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 focus:ring-purple-500"
                        />
                        <Icon className="w-5 h-5 text-gray-400" />
                        <span className="text-white">{method.name}</span>
                      </label>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
