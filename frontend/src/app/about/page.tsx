"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Trophy,
  Globe,
  Heart,
  Target,
  Zap,
  Shield,
} from "lucide-react";
import Navigation from "../components/Navigation";
import PageTransition from "../components/PageTransition";

export default function AboutPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-900">
        <Navigation />

        <main className="pt-16 sm:pt-20 pb-8 sm:pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 sm:mb-12"
            >
              <Link
                href="/"
                className="inline-flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors duration-200 mb-4 sm:mb-6 text-sm sm:text-base"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Нүүр хуудас руу буцах</span>
              </Link>

              <div className="text-center">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
                  Хөгжүүлэгчийн тухай
                </h1>
                <p className="text-lg sm:text-xl text-gray-300 max-w-4xl mx-auto px-4 sm:px-0 leading-relaxed">
                  Энэхүү website-г хөгжүүлж байгаа хүүг Өсөхбаяр гэдэг бөгөөд сонирхлоороо Mobile Legends Bang Bang тоглоомыг дараагийн түвшинд хүргэх хүслээр энэхүү санаагаа хэрэгжүүлж эхэлсэн билээ
                </p>
              </div>
            </motion.div>

            {/* Mission Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-12 sm:mb-16"
            >
              <div className="bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 lg:p-12 border border-gray-700">
                <div className="text-center mb-8 sm:mb-12">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <Target className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
                    Бидний эрхэм зорилго
                  </h2>
                  <p className="text-base sm:text-lg text-gray-300 max-w-4xl mx-auto px-4 sm:px-0 leading-relaxed">
                    Cs2 тоглогчид faceit-ийн ачаар маш их ур чадвартай болон туршлага хуримтлуулах боломжтой болсон шиг Монголд Mobile Legends тоглоом маш том 
                    байр суурийг эзлэх болсонтой холбогдуулан Mobile legends тоглочдыг дэмжхэд оршино.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  <div className="text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                      Шинэ тоглогчид олох
                    </h3>
                    <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                      Манай website-г ашиглан шинэ тоглогчид олох, уралдаан
                      тэмцээнд шууд website-аа ашиглан бүртгүүлэх гэж мэт маш
                      олон шинэ шинэ боломжуудыг олгодгоороо Монголд ганц байдаг
                      MLBB тоглоомны цогц website гэдгээрээ онцлогтой.
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                      Цогц үйлчилгээ
                    </h3>
                    <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                      Website дотроосоо нэмэлт орлого, сонирхол hobby-гоо хөгжүүлэх, шинэ тоглогчидтой танилцаж тэмцээн уралдаанд баг 
                      хамт олноороо тогтмол оролцох боломжоор хангах үйлчилгээ.
                    </p>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Vision Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mb-12 sm:mb-16"
            >
              <div className="bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 lg:p-12 border border-gray-700">
                <div className="text-center mb-8 sm:mb-12">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 border border-gray-600">
                    <Globe className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
                    Бидний онцлог
                  </h2>
                  <p className="text-base sm:text-lg text-gray-300 max-w-4xl mx-auto px-4 sm:px-0 leading-relaxed">
                    Тогтмол шинэчлэлт, хурдан ажиллагаа болон хөгжүүлэгчтэй шууд холбогдох боломжтой гэдгээрээ бусад website, серверүүдээс давуу талтай.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 border border-gray-600">
                      <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                      Шинэ мэдээ
                    </h3>
                    <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                      Mobile Legends тоглоомны шинэ update, шинэ баатар болон
                      шинэ тэмцээн уралдаан мэдээнүүдийг нэг дороос нь бэлтгэж
                      өгөх.
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 border border-gray-600">
                      <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                      Цаашлаад хөгжих
                    </h3>
                    <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                      Хэрэглэгчидтэйгээ ойр байдаг давуу талаа ашиглан хэрэглэгчдэд ээлтэй хүссэн шинэчлэлтийг хурдтай оруулж, хэрэглэгчдийн хүсэлтийн дагуу 
                      цааш хөгжих бүрэн боломжтоой.
                    </p>
                  </div>

                  <div className="text-center sm:col-span-2 lg:col-span-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 border border-gray-600">
                      <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                      Чанартай үйлчилгээ
                    </h3>
                    <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                      Server-ийн алдаа, хэрэглчдээс үүссэн асуудлыг хурдтай шийдэж user friendly system хөгжүүлж байгаагаараа онцлогтой.
                    </p>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Features Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mb-12 sm:mb-16"
            >
              <div className="text-center mb-8 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
                  Бидний санал болгож буй зүйлс
                </h2>
                <p className="text-base sm:text-lg text-gray-300 max-w-4xl mx-auto px-4 sm:px-0 leading-relaxed">
                  Тоглогчдоо сайжруулахын тулд биднээс санал болгож буй зүйлс.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {/* Player Profiles */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  viewport={{ once: true }}
                  className="bg-gray-800 rounded-xl p-5 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 group border border-gray-700"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">
                    Тоглогчийн профайл
                  </h3>
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                    Таны ур чадвар, амжилтууд, тоглоомын түүхийг харуулсан
                    дэлгэрэнгүй профайл үүсгэх.
                  </p>
                </motion.div>

                {/* Team Building */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="bg-gray-800 rounded-xl p-5 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 group border border-gray-700"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">
                    Тэмцээн бүртгэл
                  </h3>
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                    Уралдаан тэмцээнд шууд website-аа ашиглан бүртгүүлэх боломж.
                  </p>
                </motion.div>

                {/* Tournament Organization */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="bg-gray-800 rounded-xl p-5 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 group border border-gray-700"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">
                    Шинэ мэдээ
                  </h3>
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                    Mobile Legends тоглоомны шинэ update, шинэ баатар болон шинэ
                    тэмцээн уралдаан мэдээнүүдийг нэг дороос нь бэлтгэж өгөх.
                  </p>
                </motion.div>

                {/* Coaching */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  viewport={{ once: true }}
                  className="bg-gray-800 rounded-xl p-5 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 group border border-gray-700"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">
                    Monetization system
                  </h3>
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                    Тоглоом гэдэг цагаа үрэх зүйл биш, спорт, оролгоо дээшлүүлэх боломж юм. Үүнийг хэрэглэгчдэдээ нэвтрүүлэх.
                  </p>
                </motion.div>

                {/* Analytics */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  viewport={{ once: true }}
                  className="bg-gray-800 rounded-xl p-5 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 group border border-gray-700"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">
                    Цогц үйлчилгээ
                  </h3>
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                    Монголд ганц байдаг MLBB тоглоомны цогц website гэдгээрээ
                    онцлогтой. Бүх үйлчилгээг нэг дороос авах боломж.
                  </p>
                </motion.div>

                {/* Community */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  viewport={{ once: true }}
                  className="bg-gray-800 rounded-xl p-5 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 group sm:col-span-2 lg:col-span-1 border border-gray-700"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">
                    Чанартай үйлчилгээ
                  </h3>
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                    Бүгдийг чанартай тоглогчдод ээлтэй байдлаар шинэ мэдээллээс
                    хоцруулахгүй байх үүднээс үйл ажиллагаа явуулж буй website
                    юм.
                  </p>
                </motion.div>
              </div>
            </motion.section>

            {/* Stats Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="mb-12 sm:mb-16"
            >
            
            </motion.section>

            {/* CTA Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.0 }}
              className="text-center"
            >
            
            </motion.section>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
