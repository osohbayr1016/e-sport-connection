import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface RawTournamentData {
  _id: string;
  name: string;
  game: string;
  description: string;
  organizer?: string;
  organizerLogo?: string;
  startDate: string;
  endDate: string;
  registrationDeadline?: string;
  prizePool: number;
  prizeDistribution?: {
    firstPlace: number;
    secondPlace: number;
    thirdPlace: number;
  };
  maxSquads?: number;
  maxParticipants?: number;
  currentSquads?: number;
  currentParticipants?: number;
  format?: string;
  entryFee?: number;
  location?: string;
  bannerImage?: string;
  status: string;
  rules?: string;
  createdAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tournaments`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Backend API responded with status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.tournaments) {
      // Transform backend data to match frontend expectations
      const transformedTournaments = data.tournaments.map(
        (tournament: RawTournamentData) => ({
          id: tournament._id,
          name: tournament.name,
          game: tournament.game,
          gameIcon: `/games/${tournament.game
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(":", "")}.png`,
          description: tournament.description,
          organizer: {
            id: tournament.organizer || "unknown",
            name: tournament.organizer || "Unknown Organizer",
            logo: "/default-avatar.png",
            isVerified: false,
          },
          startDate: tournament.startDate,
          endDate: tournament.endDate,
          registrationDeadline: tournament.registrationDeadline,
          prizePool: tournament.prizePool,
          currency: "MNT",
          tax: 10, // Default 10% tax
          maxParticipants: tournament.maxParticipants,
          currentParticipants: tournament.currentParticipants,
          format: "Single Elimination", // Default format
          entryFee: 0, // Default no entry fee
          location: tournament.location,
          status:
            tournament.status === "upcoming"
              ? "registration_open"
              : tournament.status === "ongoing"
              ? "ongoing"
              : tournament.status === "completed"
              ? "completed"
              : "registration_closed",
          requirements: [], // Default empty requirements
          rules: tournament.rules ? [tournament.rules] : [],
          createdAt: tournament.createdAt,
        })
      );

      return NextResponse.json({
        success: true,
        tournaments: transformedTournaments,
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch tournaments",
        tournaments: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/api/tournaments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Backend API responded with status: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating tournament:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create tournament",
      },
      { status: 500 }
    );
  }
}
