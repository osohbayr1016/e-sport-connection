"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  Star,
  Shield,
  Truck,
  RefreshCw,
  CheckCircle,
  Package,
  MapPin,
  Phone,
  Mail,
  Share2,
  Plus,
  Minus,
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
  images?: string[];
  specifications?: {
    [key: string]: string;
  };
  features?: string[];
  warranty?: string;
  shipping?: string;
}


export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const { addItem, getItemQuantity } = useCart();
  const resolvedParams = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("description");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        // TODO: Implement API call to fetch product by ID
        // const response = await fetch(`/api/products/${resolvedParams.id}`);
        // const data = await response.json();
        // setProduct(data.product);
        
        // For now, keep empty state
        setProduct(null);
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [resolvedParams.id]);

  const handleAddToCart = () => {
    if (!product) return;
    
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        productId: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        vendor: product.vendor,
      });
    }
  };

  const toggleWishlist = () => {
    if (!product) return;
    
    setWishlist(prev => 
      prev.includes(product.id)
        ? prev.filter(id => id !== product.id)
        : [...prev, product.id]
    );
  };

  const tabs = [
    { key: "description", label: "Тайлбар" },
    { key: "specifications", label: "Техникийн үзүүлэлт" },
    { key: "features", label: "Онцлогууд" },
    { key: "reviews", label: "Үнэлгээ" },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Navigation />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Нэвтрэх шаардлагатай</h1>
          <p className="text-gray-300 mb-6">Барааны дэлгэрэнгүй үзэхийн тулд эхлээд нэвтэрнэ үү</p>
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-96 bg-gray-700 rounded"></div>
                <div className="space-y-4">
                  <div className="h-8 bg-gray-700 rounded"></div>
                  <div className="h-6 bg-gray-700 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Бараа олдсонгүй</h1>
            <p className="text-gray-300 mb-6">Энэ бараа байхгүй эсвэл устгагдсан байна</p>
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
                <span>{product.category}</span>
                <span className="mx-2">/</span>
                <span className="text-white">{product.name}</span>
              </nav>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Images */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {/* Main Image */}
              <div className="aspect-square bg-white/10 rounded-2xl overflow-hidden">
                <img
                  src={product.images?.[selectedImage] || product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Thumbnail Images */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors duration-200 ${
                        selectedImage === index
                          ? "border-purple-500"
                          : "border-white/20 hover:border-white/40"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              {/* Vendor */}
              <div className="flex items-center gap-3">
                <img
                  src={product.vendor.logo}
                  alt={product.vendor.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    {product.vendor.name}
                    {product.vendor.verified && <Shield className="w-4 h-4 text-blue-400" />}
                  </h3>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-gray-300 text-sm">{product.vendor.rating}</span>
                    <span className="text-gray-400 text-sm">({product.vendor.reviews} үнэлгээ)</span>
                  </div>
                </div>
              </div>

              {/* Product Name */}
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{product.name}</h1>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="text-white font-semibold">{product.rating}</span>
                    <span className="text-gray-400">({product.reviews} үнэлгээ)</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-400">{product.sold} худалдсан</span>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-white">
                  {product.price.toLocaleString()}₮
                </span>
                {product.originalPrice && (
                  <>
                    <span className="text-xl text-gray-400 line-through">
                      {product.originalPrice.toLocaleString()}₮
                    </span>
                    {product.discount && (
                      <span className="bg-red-500 text-white px-2 py-1 rounded-lg text-sm font-semibold">
                        -{product.discount}%
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                {product.inStock ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-semibold">Үлдэгдэлтэй</span>
                  </>
                ) : (
                  <>
                    <Package className="w-5 h-5 text-red-400" />
                    <span className="text-red-400 font-semibold">Үлдэгдэлгүй</span>
                  </>
                )}
              </div>

              {/* Quantity and Add to Cart */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-white font-semibold">Тоо ширхэг:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-white font-semibold min-w-[3rem] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-4">
                  {getItemQuantity(product.id) > 0 ? (
                    <div className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg">
                      <CheckCircle className="w-5 h-5" />
                      Сагсанд байна ({getItemQuantity(product.id)})
                    </div>
                  ) : (
                    <button
                      onClick={handleAddToCart}
                      disabled={!product.inStock}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Сагсанд нэмэх
                    </button>
                  )}
                  
                  <button
                    onClick={toggleWishlist}
                    className={`p-3 rounded-lg transition-colors duration-200 ${
                      wishlist.includes(product.id)
                        ? "bg-red-500 text-white"
                        : "bg-white/20 hover:bg-white/30 text-gray-300"
                    }`}
                  >
                    <Heart className="w-5 h-5" />
                  </button>
                  
                  <button className="p-3 bg-white/20 hover:bg-white/30 text-gray-300 rounded-lg transition-colors duration-200">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Shipping Info */}
              <div className="bg-white/10 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-400" />
                  <span className="text-white font-semibold">Хүргэлт</span>
                </div>
                <p className="text-gray-300 text-sm">{product.shipping}</p>
              </div>

              {/* Warranty */}
              <div className="bg-white/10 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  <span className="text-white font-semibold">Гарант</span>
                </div>
                <p className="text-gray-300 text-sm">{product.warranty}</p>
              </div>
            </motion.div>
          </div>

          {/* Product Details Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-12"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              {/* Tab Navigation */}
              <div className="flex gap-4 mb-6 border-b border-white/20">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`pb-3 px-2 font-semibold transition-colors duration-200 ${
                      activeTab === tab.key
                        ? "text-purple-400 border-b-2 border-purple-400"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="min-h-[300px]">
                {activeTab === "description" && (
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4">Барааны тайлбар</h3>
                    <p className="text-gray-300 leading-relaxed">{product.description}</p>
                  </div>
                )}

                {activeTab === "specifications" && (
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4">Техникийн үзүүлэлт</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {product.specifications && Object.entries(product.specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-2 border-b border-white/10">
                          <span className="text-gray-400">{key}:</span>
                          <span className="text-white font-semibold">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "features" && (
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4">Онцлогууд</h3>
                    <ul className="space-y-3">
                      {product.features?.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeTab === "reviews" && (
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4">Үнэлгээ ба сэтгэгдэл</h3>
                    <div className="text-center py-12">
                      <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">Үнэлгээ ба сэтгэгдэл харах функц хөгжүүлэгдэж байна</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
