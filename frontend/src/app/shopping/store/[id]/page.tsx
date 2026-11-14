"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Filter,
  Store,
  Star,
  Shield,
  Users,
  Package,
  TrendingUp,
  Grid3X3,
  List,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  Heart,
  Eye,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import Navigation from "../../../components/Navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { useCart } from "../../../contexts/CartContext";

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  vendor: {
    id: string;
    name: string;
    logo: string;
    rating: number;
    reviews: number;
    verified: boolean;
  };
  rating: number;
  reviews: number;
  sold: number;
  tags: string[];
  description: string;
  inStock: boolean;
  discount?: number;
}

interface Vendor {
  id: string;
  name: string;
  logo: string;
  banner: string;
  description: string;
  rating: number;
  reviews: number;
  products: number;
  followers: number;
  verified: boolean;
  categories: string[];
  featured: boolean;
}

const categories = [
  "Бүгд",
  "Гейминг хэрэгсэл",
  "Компьютер",
  "Хувцас",
  "Аксессуар",
  "Цахилгаан бараа",
  "Спорт бараа",
  "Цэцэг",
  "Хүүхдийн бараа",
  "Гэр ахуйн бараа",
];


export default function StoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const { addItem, getItemQuantity } = useCart();
  const resolvedParams = use(params);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Бүгд");
  const [sortBy, setSortBy] = useState("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setLoading(true);
        // TODO: Implement API call to fetch store by ID
        // const response = await fetch(`/api/stores/${resolvedParams.id}`);
        // const data = await response.json();
        // setVendor(data.vendor);
        // setProducts(data.products);
        
        // For now, keep empty state
        setVendor(null);
        setProducts([]);
      } catch (error) {
        console.error("Error fetching store data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreData();
  }, [resolvedParams.id]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "Бүгд" || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories from actual products
  const availableCategories = ["Бүгд", ...Array.from(new Set(products.map(product => product.category)))];

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "rating":
        return b.rating - a.rating;
      case "sold":
        return b.sold - a.sold;
      default:
        return b.sold - a.sold; // popular by default
    }
  });

  const addToCart = (product: Product) => {
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      vendor: product.vendor,
    });
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Navigation />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Нэвтрэх шаардлагатай</h1>
          <p className="text-gray-300 mb-6">Дэлгүүрийн мэдээлэл үзэхийн тулд эхлээд нэвтэрнэ үү</p>
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
              <div className="h-32 bg-gray-700 rounded mb-8"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Дэлгүүр олдсонгүй</h1>
            <p className="text-gray-300 mb-6">Энэ дэлгүүр байхгүй эсвэл устгагдсан байна</p>
            <Link href="/shopping">
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg">
                Дэлгүүр рүү буцах
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
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/shopping">
              <button className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div className="flex-1">
              <nav className="text-sm text-gray-400 mb-2">
                <Link href="/shopping" className="hover:text-white">Дэлгүүр</Link>
                <span className="mx-2">/</span>
                <span className="text-white">{vendor.name}</span>
              </nav>
            </div>
          </div>

          {/* Store Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8"
          >
            <div className="flex flex-col lg:flex-row gap-6">
              <img
                src={vendor.logo}
                alt={vendor.name}
                className="w-24 h-24 rounded-full object-cover mx-auto lg:mx-0"
              />
              
              <div className="flex-1 text-center lg:text-left">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center lg:justify-start gap-3">
                  {vendor.name}
                  {vendor.verified && <Shield className="w-6 h-6 text-blue-400" />}
                </h1>
                <p className="text-gray-300 mb-4">{vendor.description}</p>
                
                <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-white font-semibold">{vendor.rating}</span>
                    <span className="text-gray-400">({vendor.reviews} үнэлгээ)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-300">{vendor.products} бараа</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">{vendor.followers} дагагч</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8"
          >
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Бараа хайх..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/20 text-white placeholder-gray-300 px-12 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-white/20 text-white px-4 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none pr-10"
                >
                  {availableCategories.map((category) => (
                    <option key={category} value={category} className="bg-gray-800">
                      {category}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              </div>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white/20 text-white px-4 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none pr-10"
                >
                  <option value="popular" className="bg-gray-800">Алдартай</option>
                  <option value="price-low" className="bg-gray-800">Үнэ: Багаас их</option>
                  <option value="price-high" className="bg-gray-800">Үнэ: Ихээс бага</option>
                  <option value="rating" className="bg-gray-800">Үнэлгээ</option>
                  <option value="sold" className="bg-gray-800">Худалдсан тоо</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              </div>

              {/* View Mode */}
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-3 rounded-xl ${
                    viewMode === "grid" 
                      ? "bg-purple-600 text-white" 
                      : "bg-white/20 text-gray-300 hover:bg-white/30"
                  }`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-3 rounded-xl ${
                    viewMode === "list" 
                      ? "bg-purple-600 text-white" 
                      : "bg-white/20 text-gray-300 hover:bg-white/30"
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-4 flex justify-between items-center">
              <div className="text-gray-300">
                {sortedProducts.length} бараа олдлоо
              </div>
            </div>
          </motion.div>

          {/* Products Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20 hover:border-purple-500/50 transition-all duration-300 group"
                  >
                    {/* Product Image */}
                    <div className="relative">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {product.discount && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-lg text-sm font-semibold">
                          -{product.discount}%
                        </div>
                      )}
                      <button
                        onClick={() => toggleWishlist(product.id)}
                        className={`absolute top-2 right-2 p-2 rounded-full transition-colors duration-200 ${
                          wishlist.includes(product.id)
                            ? "bg-red-500 text-white"
                            : "bg-white/20 text-gray-300 hover:bg-white/30"
                        }`}
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      {/* Product Name */}
                      <h3 className="text-white font-semibold mb-2 line-clamp-2">
                        {product.name}
                      </h3>

                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-gray-300 text-sm">{product.rating}</span>
                        <span className="text-gray-400 text-sm">({product.reviews})</span>
                      </div>

                      {/* Price */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-white font-bold text-lg">
                          {product.price.toLocaleString()}₮
                        </span>
                        {product.originalPrice && (
                          <span className="text-gray-400 line-through text-sm">
                            {product.originalPrice.toLocaleString()}₮
                          </span>
                        )}
                      </div>

                      {/* Sold */}
                      <div className="text-gray-400 text-sm mb-4">
                        {product.sold} ширхэг худалдсан
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {getItemQuantity(product.id) > 0 ? (
                          <div className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg">
                            <CheckCircle className="w-4 h-4" />
                            Сагсанд байна ({getItemQuantity(product.id)})
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(product)}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Сагсанд нэмэх
                          </button>
                        )}
                        <Link href={`/shopping/product/${product.id}`}>
                          <button className="p-2 bg-white/20 hover:bg-white/30 text-gray-300 rounded-lg transition-colors duration-200">
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {sortedProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-purple-500/50 transition-all duration-300"
                  >
                    <div className="flex gap-6">
                      {/* Product Image */}
                      <div className="relative">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-32 h-32 object-cover rounded-xl"
                        />
                        {product.discount && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-lg text-sm font-semibold">
                            -{product.discount}%
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-lg mb-2">
                          {product.name}
                        </h3>

                        <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                          {product.description}
                        </p>

                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-gray-300 text-sm">{product.rating}</span>
                            <span className="text-gray-400 text-sm">({product.reviews})</span>
                          </div>
                          <span className="text-gray-400 text-sm">{product.sold} ширхэг худалдсан</span>
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-white font-bold text-xl">
                            {product.price.toLocaleString()}₮
                          </span>
                          {product.originalPrice && (
                            <span className="text-gray-400 line-through">
                              {product.originalPrice.toLocaleString()}₮
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {getItemQuantity(product.id) > 0 ? (
                            <div className="bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Сагсанд байна ({getItemQuantity(product.id)})
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(product)}
                              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                            >
                              <ShoppingCart className="w-4 h-4" />
                              Сагсанд нэмэх
                            </button>
                          )}
                          <button
                            onClick={() => toggleWishlist(product.id)}
                            className={`p-2 rounded-lg transition-colors duration-200 ${
                              wishlist.includes(product.id)
                                ? "bg-red-500 text-white"
                                : "bg-white/20 text-gray-300 hover:bg-white/30"
                            }`}
                          >
                            <Heart className="w-4 h-4" />
                          </button>
                          <Link href={`/shopping/product/${product.id}`}>
                            <button className="p-2 bg-white/20 hover:bg-white/30 text-gray-300 rounded-lg transition-colors duration-200">
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Empty State */}
          {sortedProducts.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                Бараа олдсонгүй
              </h3>
              <p className="text-gray-400">
                Хайлтын нөхцөлөө өөрчилж дахин оролдоно уу
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
