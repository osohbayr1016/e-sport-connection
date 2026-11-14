import Image from "next/image";
import { SquadDivision } from "../types/division";
import { DivisionService } from "../services/divisionService";

interface DivisionCoinImageProps {
  division: SquadDivision;
  size?: number;
  className?: string;
  showGlow?: boolean;
}

export default function DivisionCoinImage({
  division,
  size = 48,
  className = "",
  showGlow = false,
}: DivisionCoinImageProps) {
  const coinImageUrl = DivisionService.getDivisionCoinImage(division);
  const divisionColor = DivisionService.getDivisionColor(division);

  return (
    <div className={`relative ${className}`}>
      <Image
        src={coinImageUrl}
        alt={`${DivisionService.getDivisionDisplayName(division)} Coin`}
        width={size}
        height={size}
        className="rounded-full"
      />
      {showGlow && (
        <div
          className="absolute inset-0 rounded-full animate-pulse opacity-60"
          style={{
            boxShadow: `0 0 ${size * 0.3}px ${size * 0.15}px ${divisionColor}`,
          }}
        />
      )}
    </div>
  );
}
