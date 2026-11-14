"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Store,
  Plus,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  Package,
  Users,
  DollarSign,
  Star,
  Search,
  Filter,
  Upload,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import Navigation from "../../components/Navigation";
import { useAuth } from "../../contexts/AuthContext";

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  description: string;
  stock: number;
  status: "active" | "inactive" | "draft";
  rating: number;
  reviews: number;
  sold: number;
  createdAt: string;
  updatedAt: string;
}

interface VendorStats {
  totalProducts: number;
  activeProducts: number;
  totalSales: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  monthlySales: number;
  monthlyRevenue: number;
}

const categories = [
  "Гейминг хэрэгсэл",
  "Компьютер",
  "Хувцас",
  "Аксессуар",
  "Цахилгаан бараа",
  "Спорт бараа",
  "Цэцэг",
  "Хүүхдийн бараа",
  "Гэр ахуйн бараа",
  "Бусад",
];

export default function VendorDashboardPage() {
  const { user } = useAuth();
  const [vendorStatus, setVendorStatus] = useState<'pending' | 'approved' | 'rejected' | 'loading'>('loading');
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<VendorStats>({
    totalProducts: 0,
    activeProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalReviews: 0,
    monthlySales: 0,
    monthlyRevenue: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Бүгд");
  const [selectedStatus, setSelectedStatus] = useState("Бүгд");
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "",
    price: 0,
    originalPrice: 0,
    image: "",
    category: "",
    description: "",
    stock: 0,
    status: "draft",
  });

  // Check vendor status on component mount
  useEffect(() => {
    const checkVendorStatus = async () => {
      try {
        // Simulate API call to check vendor status
        // In real implementation, this would call your backend
        setTimeout(() => {
          setVendorStatus('approved'); // Mock: assume approved for demo
        }, 1000);
      } catch (error) {
        console.error('Error checking vendor status:', error);
        setVendorStatus('pending');
      }
    };

    checkVendorStatus();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Бүгд" || product.category === selectedCategory;
    const matchesStatus = selectedStatus === "Бүгд" || product.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price || !newProduct.category) {
      alert("Шаардлагатай талбаруудыг бөглөнө үү");
      return;
    }

    const product: Product = {
      id: Date.now().toString(),
      name: newProduct.name,
      price: newProduct.price,
      originalPrice: newProduct.originalPrice,
      image: newProduct.image || "/images/default-product.jpg",
      category: newProduct.category,
      description: newProduct.description || "",
      stock: newProduct.stock || 0,
      status: newProduct.status as "active" | "inactive" | "draft",
      rating: 0,
      reviews: 0,
      sold: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProducts(prev => [product, ...prev]);
    setNewProduct({
      name: "",
      price: 0,
      originalPrice: 0,
      image: "",
      category: "",
      description: "",
      stock: 0,
      status: "draft",
    });
    setIsAddProductModalOpen(false);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct(product);
    setIsAddProductModalOpen(true);
  };

  const handleUpdateProduct = () => {
    if (!editingProduct || !newProduct.name || !newProduct.price || !newProduct.category) {
      alert("Шаардлагатай талбаруудыг бөглөнө үү");
      return;
    }

    setProducts(prev => prev.map(p => 
      p.id === editingProduct.id 
        ? { ...p, ...newProduct, updatedAt: new Date().toISOString() }
        : p
    ));
    
    setEditingProduct(null);
    setNewProduct({
      name: "",
      price: 0,
      originalPrice: 0,
      image: "",
      category: "",
      description: "",
      stock: 0,
      status: "draft",
    });
    setIsAddProductModalOpen(false);
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm("Энэ барааг устгахдаа итгэлтэй байна уу?")) {
      setProducts(prev => prev.filter(p => p.id !== productId));
    }
  };

  const handleToggleStatus = (productId: string) => {
    setProducts(prev => prev.map(p => 
      p.id === productId 
        ? { ...p, status: p.status === "active" ? "inactive" : "active" }
        : p
    ));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Navigation />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Нэвтрэх шаардлагатай</h1>
          <p className="text-gray-300 mb-6">Дэлгүүрийн самбар үзэхийн тулд эхлээд нэвтэрнэ үү</p>
          <Link href="/auth/login">
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg">
              Нэвтрэх
            </button>
          </Link>
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
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Store className="w-10 h-10 text-purple-400" />
                Дэлгүүрийн самбар
              </h1>
              <p className="text-gray-300">
                Gaming Pro Store - Бараа бүтээгдэхүүнээ удирдах
              </p>
            </div>
            <Link href="/shopping">
              <button className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Дэлгүүр үзэх
              </button>
            </Link>
          </div>

          {/* Vendor Status Banner */}
          {vendorStatus === 'loading' && (
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-blue-300">Дэлгүүрийн статус шалгаж байна...</p>
              </div>
            </div>
          )}

          {vendorStatus === 'pending' && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 mb-8">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-yellow-300 font-medium">Дэлгүүрийн бүртгэл хүлээгдэж буй</p>
                  <p className="text-yellow-200 text-sm">Манай баг таны бүртгэлийг шалгаж байна. Тун удахгүй мэдэгдэх болно.</p>
                </div>
              </div>
            </div>
          )}

          {vendorStatus === 'rejected' && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-8">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-red-300 font-medium">Дэлгүүрийн бүртгэл татгалзсан</p>
                  <p className="text-red-200 text-sm">Дэлгүүрийн бүртгэл татгалзсан байна. Дэлгэрэнгүй мэдээллийг имэйлээр хүлээн авна уу.</p>
                </div>
              </div>
            </div>
          )}

          {vendorStatus === 'approved' && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 mb-8">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <p className="text-green-300 font-medium">Дэлгүүр зөвшөөрөгдсөн - Бараа нэмж эхлэх боломжтой</p>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
            >
              <div className="flex items-center justify-between mb-4">
                <Package className="w-8 h-8 text-blue-400" />
                <span className="text-green-400 text-sm font-semibold">+12%</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{stats.totalProducts}</h3>
              <p className="text-gray-300 text-sm">Нийт бараа</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
            >
              <div className="flex items-center justify-between mb-4">
                <ShoppingCart className="w-8 h-8 text-green-400" />
                <span className="text-green-400 text-sm font-semibold">+8%</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{stats.totalSales}</h3>
              <p className="text-gray-300 text-sm">Нийт худалдаа</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
            >
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-8 h-8 text-yellow-400" />
                <span className="text-green-400 text-sm font-semibold">+15%</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">
                {(stats.totalRevenue / 1000000).toFixed(1)}M₮
              </h3>
              <p className="text-gray-300 text-sm">Нийт орлого</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
            >
              <div className="flex items-center justify-between mb-4">
                <Star className="w-8 h-8 text-purple-400" />
                <span className="text-green-400 text-sm font-semibold">+0.2</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{stats.averageRating}</h3>
              <p className="text-gray-300 text-sm">Дундаж үнэлгээ</p>
            </motion.div>
          </div>

          {/* Products Management */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Бараа бүтээгдэхүүн</h2>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setNewProduct({
                    name: "",
                    price: 0,
                    originalPrice: 0,
                    image: "",
                    category: "",
                    description: "",
                    stock: 0,
                    status: "draft",
                  });
                  setIsAddProductModalOpen(true);
                }}
                disabled={vendorStatus !== 'approved'}
                className={`px-6 py-3 rounded-lg transition-colors duration-200 flex items-center gap-2 ${
                  vendorStatus === 'approved'
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Plus className="w-5 h-5" />
                Шинэ бараа нэмэх
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Бараа хайх..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/10 text-white placeholder-gray-300 px-12 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white/10 text-white px-4 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Бүгд" className="bg-gray-800">Бүх ангилал</option>
                {categories.map((category) => (
                  <option key={category} value={category} className="bg-gray-800">
                    {category}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-white/10 text-white px-4 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Бүгд" className="bg-gray-800">Бүх статус</option>
                <option value="active" className="bg-gray-800">Идэвхтэй</option>
                <option value="inactive" className="bg-gray-800">Идэвхгүй</option>
                <option value="draft" className="bg-gray-800">Ноорог</option>
              </select>
            </div>

            {/* Products Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left text-gray-300 py-4 px-2">Бараа</th>
                    <th className="text-left text-gray-300 py-4 px-2">Ангилал</th>
                    <th className="text-left text-gray-300 py-4 px-2">Үнэ</th>
                    <th className="text-left text-gray-300 py-4 px-2">Үлдэгдэл</th>
                    <th className="text-left text-gray-300 py-4 px-2">Статус</th>
                    <th className="text-left text-gray-300 py-4 px-2">Худалдаа</th>
                    <th className="text-left text-gray-300 py-4 px-2">Үйлдэл</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                          <div>
                            <h3 className="text-white font-semibold">{product.name}</h3>
                            <p className="text-gray-400 text-sm">{product.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-gray-300">{product.category}</td>
                      <td className="py-4 px-2">
                        <div>
                          <span className="text-white font-semibold">
                            {product.price.toLocaleString()}₮
                          </span>
                          {product.originalPrice && (
                            <span className="text-gray-400 line-through text-sm ml-2">
                              {product.originalPrice.toLocaleString()}₮
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <span className={`px-2 py-1 rounded-full text-sm ${
                          product.stock > 10 
                            ? "bg-green-500/20 text-green-400" 
                            : product.stock > 0 
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                        }`}>
                          {product.stock} ширхэг
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <span className={`px-2 py-1 rounded-full text-sm ${
                          product.status === "active" 
                            ? "bg-green-500/20 text-green-400" 
                            : product.status === "inactive"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}>
                          {product.status === "active" && "Идэвхтэй"}
                          {product.status === "inactive" && "Идэвхгүй"}
                          {product.status === "draft" && "Ноорог"}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-gray-300 text-sm">{product.rating}</span>
                          <span className="text-gray-400 text-sm">({product.reviews})</span>
                        </div>
                        <div className="text-gray-400 text-sm">{product.sold} худалдсан</div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors duration-200"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(product.id)}
                            className={`p-2 rounded-lg transition-colors duration-200 ${
                              product.status === "active"
                                ? "bg-red-500/20 hover:bg-red-500/30 text-red-400"
                                : "bg-green-500/20 hover:bg-green-500/30 text-green-400"
                            }`}
                          >
                            {product.status === "active" ? (
                              <X className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-16">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">
                  Бараа олдсонгүй
                </h3>
                <p className="text-gray-400">
                  Хайлтын нөхцөлөө өөрчилж дахин оролдоно уу
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Add/Edit Product Modal */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingProduct ? "Бараа засах" : "Шинэ бараа нэмэх"}
              </h2>
              <button
                onClick={() => setIsAddProductModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Барааны нэр *
                </label>
                <input
                  type="text"
                  value={newProduct.name || ""}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-white/10 text-white px-4 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Барааны нэр оруулна уу"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Үнэ *
                  </label>
                  <input
                    type="number"
                    value={newProduct.price || ""}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="w-full bg-white/10 text-white px-4 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="Үнэ оруулна уу"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Анхны үнэ
                  </label>
                  <input
                    type="number"
                    value={newProduct.originalPrice || ""}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, originalPrice: Number(e.target.value) }))}
                    className="w-full bg-white/10 text-white px-4 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="Анхны үнэ оруулна уу"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Ангилал *
                  </label>
                  <select
                    value={newProduct.category || ""}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-white/10 text-white px-4 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="" className="bg-gray-800">Ангилал сонгох</option>
                    {categories.map((category) => (
                      <option key={category} value={category} className="bg-gray-800">
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Үлдэгдэл
                  </label>
                  <input
                    type="number"
                    value={newProduct.stock || ""}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, stock: Number(e.target.value) }))}
                    className="w-full bg-white/10 text-white px-4 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="Үлдэгдэл тоо"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Тайлбар
                </label>
                <textarea
                  value={newProduct.description || ""}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full bg-white/10 text-white px-4 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Барааны тайлбар бичнэ үү"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Зурагны холбоос
                </label>
                <input
                  type="url"
                  value={newProduct.image || ""}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, image: e.target.value }))}
                  className="w-full bg-white/10 text-white px-4 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Статус
                </label>
                <select
                  value={newProduct.status || "draft"}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, status: e.target.value as "active" | "inactive" | "draft" }))}
                  className="w-full bg-white/10 text-white px-4 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="draft" className="bg-gray-800">Ноорог</option>
                  <option value="active" className="bg-gray-800">Идэвхтэй</option>
                  <option value="inactive" className="bg-gray-800">Идэвхгүй</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <button
                onClick={() => setIsAddProductModalOpen(false)}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200"
              >
                Цуцлах
              </button>
              <button
                onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editingProduct ? "Хадгалах" : "Нэмэх"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
