"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Search,
  Filter,
  Store,
  Star,
  ShoppingCart,
  Heart,
  Eye,
  MapPin,
  Clock,
  Users,
  TrendingUp,
  Award,
  Zap,
  Shield,
  Truck,
  CreditCard,
  Gift,
  Tag,
  Grid3X3,
  List,
  ChevronDown,
  ChevronUp,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import Navigation from "../components/Navigation";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";

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

export default function ShoppingPage() {
  const { user } = useAuth();
  const { addItem, getItemQuantity, toggleCart, state } = useCart();
  
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Бүгд");
  const [sortBy, setSortBy] = useState("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

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
    console.log("Adding product to cart:", product);
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      vendor: product.vendor,
    });
    console.log("Product added to cart successfully");
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <ShoppingBag className="w-10 h-10 text-purple-400" />
            Shopping
          </h1>
          <p className="text-gray-300 text-lg mb-6">
            Олон дэлгүүрүүдийн бараа бүтээгдэхүүнийг нэг дороос харж худалдаж аваарай
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/shopping/vendor-registration">
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center gap-2">
                <Store className="w-5 h-5" />
                Дэлгүүр нээх
              </button>
            </Link>
            <Link href="/shopping/vendor-dashboard">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Дэлгүүрийн самбар
              </button>
            </Link>
            <Link href="/shopping/cart">
              <button className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Миний сагс ({state.totalItems})
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Search and Filters */}
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

          {/* Advanced Filters Toggle */}
          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-purple-400 hover:text-purple-300"
            >
              <Filter className="w-5 h-5" />
              Дэлгэрэнгүй шүүлтүүр
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            <div className="text-gray-300">
              {sortedProducts.length} бараа олдлоо
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 pt-4 border-t border-white/20"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Price Range */}
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Үнийн хүрээ</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      className="flex-1 bg-white/20 text-white px-3 py-2 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      className="flex-1 bg-white/20 text-white px-3 py-2 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Үнэлгээ</label>
                  <select className="w-full bg-white/20 text-white px-3 py-2 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="" className="bg-gray-800">Бүх үнэлгээ</option>
                    <option value="5" className="bg-gray-800">5 од</option>
                    <option value="4" className="bg-gray-800">4+ од</option>
                    <option value="3" className="bg-gray-800">3+ од</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Featured Vendors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Award className="w-6 h-6 text-yellow-400" />
            Онцлох дэлгүүрүүд
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {vendors.filter(v => v.featured).map((vendor) => (
              <motion.div
                key={vendor.id}
                whileHover={{ scale: 1.05 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-purple-500/50 transition-all duration-300 flex flex-col h-full"
              >
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={vendor.logo}
                    alt={vendor.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-white font-semibold flex items-center gap-1">
                      {vendor.name}
                      {vendor.verified && <Shield className="w-4 h-4 text-blue-400" />}
                    </h3>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-gray-300 text-sm">{vendor.rating}</span>
                      <span className="text-gray-400 text-sm">({vendor.reviews})</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-300 text-sm mb-4 flex-1">{vendor.description}</p>
                
                <div className="flex justify-between text-sm text-gray-400 mb-4">
                  <span>{vendor.products} бараа</span>
                  <span>{vendor.followers} дагагч</span>
                </div>
                
                <Link href={`/shopping/store/${vendor.id}`}>
                  <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors duration-200 mt-auto">
                    Дэлгүүр үзэх
                  </button>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Products Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">
              Бараа бүтээгдэхүүн
            </h2>
            <div className="text-gray-300">
              {sortedProducts.length} бараа олдлоо
            </div>
          </div>

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
                    {/* Vendor */}
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={product.vendor.logo}
                        alt={product.vendor.name}
                        className="w-5 h-5 rounded-full"
                      />
                      <span className="text-gray-300 text-sm">{product.vendor.name}</span>
                      {product.vendor.verified && <Shield className="w-3 h-3 text-blue-400" />}
                    </div>

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
                      <div className="flex items-center gap-2 mb-2">
                        <img
                          src={product.vendor.logo}
                          alt={product.vendor.name}
                          className="w-5 h-5 rounded-full"
                        />
                        <span className="text-gray-300 text-sm">{product.vendor.name}</span>
                        {product.vendor.verified && <Shield className="w-3 h-3 text-blue-400" />}
                      </div>

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
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              Бараа олдсонгүй
            </h3>
            <p className="text-gray-400">
              Хайлтын нөхцөлөө өөрчилж дахин оролдоно уу
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
