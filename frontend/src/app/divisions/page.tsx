"use client";

import React, { useState, useEffect } from "react";
import { SquadDivision, DivisionConfig } from "@/types/division";
import { DivisionService } from "@/services/divisionService";
import DivisionCard from "@/components/divisions/DivisionCard";
import DivisionLeaderboard from "@/components/divisions/DivisionLeaderboard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function DivisionsPage() {
  const [divisions, setDivisions] = useState<DivisionConfig[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<SquadDivision>(
    SquadDivision.SILVER
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDivisions();
  }, []);

  const fetchDivisions = async () => {
    try {
      setLoading(true);
      const divisionsData = await DivisionService.getDivisionsInfo();
      setDivisions(divisionsData);
    } catch (err) {
      setError("Дивизийн мэдээллийг татаж чадсангүй");
      console.error("Error fetching divisions:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Алдаа</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={fetchDivisions}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Дахин оролдох
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              Дивизийн систем
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Тэмцээнүүдэд оролцож Bounty Coin цуглуулан дивизүүдээр ахина уу.
              Дивиз бүр өөрийн гэсэн сорилт, шагналтай.
            </p>
          </div>
        </div>
      </div>

      {/* Division Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {divisions.map((division) => (
            <DivisionCard
              key={division.name}
              division={division}
              isSelected={selectedDivision === division.name}
              onSelect={() => setSelectedDivision(division.name)}
            />
          ))}
        </div>

        {/* Division Leaderboard */}
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">
              {DivisionService.getDivisionDisplayName(selectedDivision)}{" "}
              Лидерборд
            </h2>
            <p className="text-gray-300 mt-1">
              Тэргүүлэгч багууд:{" "}
              {DivisionService.getDivisionDisplayName(
                selectedDivision
              ).toLowerCase()}
            </p>
          </div>
          <DivisionLeaderboard division={selectedDivision} />
        </div>
      </div>

      {/* Division Rules */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
          <h3 className="text-2xl font-bold text-white mb-6">
            Дивизийн дүрэм
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-gray-200 mb-4">
                Ахиц дэвшил
              </h4>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>
                    Бүх багууд <strong>Silver Division</strong> (0-250 Bounty
                    Coin)-оос эхэлнэ
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>
                    250 coin хүрвэл <strong>Gold Division</strong> руу дэвшинэ
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>
                    750 coin хүрвэл <strong>Diamond Division</strong> руу
                    дэвшинэ
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Diamond Division-д ахиц дэвшлийн дээд хязгааргүй</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-200 mb-4">
                Хамгаалалтын систем
              </h4>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">🛡️</span>
                  <span>
                    0 coin болоход баг бүр <strong>2 хамгаалалт</strong> авна
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">🛡️</span>
                  <span>Хамгаалалт нь дивиз буурахаас сэргийлнэ</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">🛡️</span>
                  <span>
                    Ялалт болон дивиз өөрчлөгдөхөд хамгаалалт дахин шинэчлэгдэнэ
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">⚠️</span>
                  <span>Хамгаалалтгүйгээр 2 ялагдвал = дивиз буурах</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-900/30 rounded-lg border border-blue-700">
            <h4 className="text-lg font-semibold text-blue-200 mb-2">
              Bounty Coin систем
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-blue-300">
                  Silver дивиз
                </div>
                <div className="text-blue-400">
                  50 coin = 10,000 MNT
                </div>
                <div className="text-blue-400">
                  Ялалт: +50, Ялагдал: -25
                </div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-blue-300">
                  Gold дивиз
                </div>
                <div className="text-blue-400">
                  50 coin = 20,000 MNT
                </div>
                <div className="text-blue-400">
                  Ялалт: +50, Ялагдал: -25
                </div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-blue-300">
                  Diamond дивиз
                </div>
                <div className="text-blue-400">
                  50 coin = 30,000 MNT
                </div>
                <div className="text-blue-400">
                  Ялалт: +50, Ялагдал: -25
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
