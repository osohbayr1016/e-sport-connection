"use client";

import { motion } from "framer-motion";
import { CheckCircle, Clock, Mail, Store, ArrowRight } from "lucide-react";
import Link from "next/link";
import Navigation from "../../components/Navigation";

export default function VendorOnboardingSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto text-center"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8"
          >
            <CheckCircle className="w-12 h-12 text-white" />
          </motion.div>

          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-4">
              Дэлгүүрийн бүртгэл амжилттай хадгалагдлаа!
            </h1>
            <p className="text-gray-300 text-lg">
              Таны дэлгүүрийн бүртгэлийн хүсэлт манай багт хүргэгдлээ. 
              Тун удахгүй шалгаж үзэх болно.
            </p>
          </motion.div>

          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Clock className="w-6 h-6 text-yellow-400" />
              <h2 className="text-xl font-semibold text-white">Одоогийн статус</h2>
            </div>
            <div className="bg-yellow-400/20 text-yellow-300 px-4 py-2 rounded-lg inline-block mb-4">
              Хүлээгдэж буй
            </div>
            <p className="text-gray-300">
              Манай баг таны дэлгүүрийн бүртгэлийг шалгаж байна. 
              Шалгалт дууссаны дараа имэйлээр мэдэгдэх болно.
            </p>
          </motion.div>

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8"
          >
            <h3 className="text-xl font-semibold text-white mb-6">Дараах алхамууд</h3>
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white text-sm font-semibold">1</span>
                </div>
                <div>
                  <h4 className="text-white font-medium">Баримт бичгийн шалгалт</h4>
                  <p className="text-gray-300 text-sm">
                    Таны оруулсан бизнес лиценз болон бусад баримт бичгүүдийг шалгана
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white text-sm font-semibold">2</span>
                </div>
                <div>
                  <h4 className="text-white font-medium">Мэдээлэл баталгаажуулах</h4>
                  <p className="text-gray-300 text-sm">
                    Холбоо барих мэдээлэл болон дэлгүүрийн мэдээллийг баталгаажуулна
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white text-sm font-semibold">3</span>
                </div>
                <div>
                  <h4 className="text-white font-medium">Зөвшөөрөл олгох</h4>
                  <p className="text-gray-300 text-sm">
                    Бүх зүйл зөв байвал дэлгүүрийг зөвшөөрч, идэвхжүүлнэ
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-blue-400" />
              <h3 className="text-xl font-semibold text-white">Холбоо барих</h3>
            </div>
            <p className="text-gray-300 mb-4">
              Асуудал гарвал манай багтай холбоо барина уу
            </p>
            <div className="space-y-2">
              <p className="text-white">
                <span className="text-gray-400">Имэйл:</span> support@esport.mn
              </p>
              <p className="text-white">
                <span className="text-gray-400">Утас:</span> +976 11 123456
              </p>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/shopping">
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg flex items-center gap-2 transition-colors duration-200">
                <Store className="w-5 h-5" />
                Дэлгүүрүүд үзэх
              </button>
            </Link>
            
            <Link href="/profile">
              <button className="bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded-lg flex items-center gap-2 transition-colors duration-200">
                Миний профайл
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </motion.div>

          {/* Timeline Estimate */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="mt-8 text-center"
          >
            <p className="text-gray-400 text-sm">
              Шалгалтын хугацаа: <span className="text-white font-medium">1-3 хоног</span>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
