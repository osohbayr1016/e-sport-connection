export interface TournamentSquad {
  _id: string;
  name: string;
  game: string;
  leader: string | { _id?: string; id?: string };
  members: Array<string | { _id?: string; id?: string }>;
}
const identifier = (value: string | { _id?: string; id?: string } | null | undefined) =>
  typeof value === "string" ? value : value?._id || value?.id || "";

export function selectTournamentSquad(
  squads: TournamentSquad[], userId: string, game: string,
): { squad: TournamentSquad | null; reason: string } {
  const led = squads.filter(s => identifier(s.leader) === userId);
  if (!led.length) return { squad: null, reason: "Тэмцээнд оролцох багийн ахлагч байх шаардлагатай." };
  const matching = led.filter(s => s.game?.trim().toLowerCase() === game?.trim().toLowerCase());
  if (!matching.length) return { squad: null, reason: "Энэ тоглоомд тохирох баг олдсонгүй." };
  const valid = matching.find(s => {
    const ids = new Set((Array.isArray(s.members) ? s.members : []).map(identifier).filter(Boolean));
    ids.add(identifier(s.leader));
    return ids.size >= 5 && ids.size <= 7;
  });
  if (valid) return { squad: valid, reason: "" };
  return { squad: null, reason: "Баг 5–7 өөр тоглогчтой байх ёстой. Багийн бүрэлдэхүүнээ шалгана уу." };
}
