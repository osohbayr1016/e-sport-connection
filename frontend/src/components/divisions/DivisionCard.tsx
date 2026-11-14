import React from "react";
import Image from "next/image";
import { DivisionConfig, SquadDivision } from "@/types/division";
import { DivisionService } from "@/services/divisionService";

interface DivisionCardProps {
  division: DivisionConfig;
  isSelected: boolean;
  onSelect: () => void;
}

export default function DivisionCard({
  division,
  isSelected,
  onSelect,
}: DivisionCardProps) {
  const getDivisionIcon = (divisionName: SquadDivision) => {
    const coinImageUrl = DivisionService.getDivisionCoinImage(divisionName);
    return (
      <Image
        src={coinImageUrl}
        alt={`${DivisionService.getDivisionDisplayName(divisionName)} Coin`}
        width={64}
        height={64}
        className="mx-auto rounded-full"
      />
    );
  };

  const getDivisionGradient = (divisionName: SquadDivision) => {
    // Use consistent dark gray background
    return "from-gray-800 to-gray-800";
  };

  return (
    <div
      className={`relative cursor-pointer transition-all duration-300 transform hover:scale-105 ${
        isSelected ? "ring-4 ring-blue-500 ring-opacity-50" : ""
      } h-full`}
      onClick={onSelect}
    >
      <div
        className={`bg-gradient-to-br ${getDivisionGradient(
          division.name
        )} rounded-xl shadow-lg overflow-hidden border border-gray-700 h-full flex flex-col`}
      >
        {/* Header */}
        <div className="p-6 text-center bg-gradient-to-r from-blue-600 to-indigo-700 min-h-[160px] flex flex-col items-center justify-center">
          <div className="mb-3">{getDivisionIcon(division.name)}</div>
          <h3 className="text-2xl font-bold mb-2 text-white">
            {division.displayName}
          </h3>
          <p className="text-blue-100 text-sm">{division.requirements}</p>
        </div>

        {/* Content */}
        <div className="bg-gray-800 p-6 flex-1 flex flex-col">
          {/* Upgrade Cost */}
          {division.upgradeCost && (
            <div className="mb-4 p-3 bg-gray-700 rounded-lg border border-gray-600">
              <div className="text-sm text-gray-300 mb-1">Upgrade Cost</div>
              <div className="text-lg font-bold text-white">
                {division.upgradeCost} Bounty Coins
              </div>
            </div>
          )}

          {/* Bounty Coin Price */}
          <div className="mb-4 p-3 bg-blue-900/30 rounded-lg border border-blue-700">
            <div className="text-sm text-blue-300 mb-1">50 Bounty Coins</div>
            <div className="text-lg font-bold text-blue-200">
              {division.bountyCoinPrice.toLocaleString()} MNT
            </div>
          </div>

          {/* Win/Lose Rewards */}
          <div className="grid grid-cols-2 gap-3 mt-auto">
            <div className="text-center p-3 bg-green-900/30 rounded-lg border border-green-700">
              <div className="text-sm text-green-300 mb-1">Win</div>
              <div className="text-lg font-bold text-green-200">
                +{division.bountyCoinAmount}
              </div>
            </div>
            <div className="text-center p-3 bg-red-900/30 rounded-lg border border-red-700">
              <div className="text-sm text-red-300 mb-1">Lose</div>
              <div className="text-lg font-bold text-red-200">
                -{division.deductionAmount}
              </div>
            </div>
          </div>

          {/* Status Indicator */}
          {isSelected && (
            <div className="absolute top-4 right-4">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
