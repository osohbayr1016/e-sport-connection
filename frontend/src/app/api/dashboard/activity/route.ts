import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    // Fetch recent activities from multiple endpoints
    const [
      newsResponse,
      usersResponse,
      tournamentsResponse,
      profilesResponse,
      proPlayersResponse,
    ] = await Promise.allSettled([
      fetch(`${API_BASE_URL}/api/news`),
      fetch(`${API_BASE_URL}/api/users`),
      fetch(`${API_BASE_URL}/api/tournaments`),
      fetch(`${API_BASE_URL}/api/player-profiles/profiles`),
      fetch(`${API_BASE_URL}/api/pro-players`),
    ]);

    const activities: any[] = [];

    // Process news activities
    if (newsResponse.status === "fulfilled" && newsResponse.value.ok) {
      const newsData = await newsResponse.value.json();
      if (newsData.success && newsData.news) {
        const recentNews = newsData.news.slice(0, 3).map((item: any) => ({
          id: item._id || item.id,
          type: "news",
          title: `New article: ${item.title}`,
          timestamp: item.createdAt,
          icon: "newspaper",
          color: "bg-blue-500/20 text-blue-400",
        }));
        activities.push(...recentNews);
      }
    }

    // Process user activities
    if (usersResponse.status === "fulfilled" && usersResponse.value.ok) {
      const usersData = await usersResponse.value.json();
      if (usersData.success && usersData.users) {
        const recentUsers = usersData.users.slice(0, 2).map((user: any) => ({
          id: user._id || user.id,
          type: "user",
          title: `New user registered: ${user.name || user.email}`,
          timestamp: user.createdAt,
          icon: "user",
          color: "bg-green-500/20 text-green-400",
        }));
        activities.push(...recentUsers);
      }
    }

    // Process tournament activities
    if (
      tournamentsResponse.status === "fulfilled" &&
      tournamentsResponse.value.ok
    ) {
      const tournamentsData = await tournamentsResponse.value.json();
      if (tournamentsData.success && tournamentsData.tournaments) {
        const recentTournaments = tournamentsData.tournaments
          .slice(0, 2)
          .map((tournament: any) => ({
            id: tournament._id || tournament.id,
            type: "tournament",
            title: `New tournament: ${tournament.name}`,
            timestamp: tournament.createdAt,
            icon: "trophy",
            color: "bg-purple-500/20 text-purple-400",
          }));
        activities.push(...recentTournaments);
      }
    }

    // Process profile activities
    if (profilesResponse.status === "fulfilled" && profilesResponse.value.ok) {
      const profilesData = await profilesResponse.value.json();
      if (profilesData.success && profilesData.profiles) {
        const recentProfiles = profilesData.profiles
          .slice(0, 2)
          .map((profile: any) => ({
            id: profile._id || profile.id,
            type: "profile",
            title: `New profile created: ${
              profile.playerName || "Player Profile"
            }`,
            timestamp: profile.createdAt,
            icon: "shield",
            color: "bg-orange-500/20 text-orange-400",
          }));
        activities.push(...recentProfiles);
      }
    }

    // Process pro player activities
    if (
      proPlayersResponse.status === "fulfilled" &&
      proPlayersResponse.value.ok
    ) {
      const proPlayersData = await proPlayersResponse.value.json();
      if (proPlayersData.success && proPlayersData.proPlayers) {
        const recentProPlayers = proPlayersData.proPlayers
          .slice(0, 2)
          .map((player: any) => ({
            id: player._id || player.id,
            type: "pro-player",
            title: `New pro player: ${player.userId?.name || "Pro Player"}`,
            timestamp: player.createdAt,
            icon: "trophy",
            color: "bg-yellow-500/20 text-yellow-400",
          }));
        activities.push(...recentProPlayers);
      }
    }

    // Sort activities by timestamp (most recent first)
    activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );


    // Return only the 5 most recent activities
    const recentActivities = activities.slice(0, 5);

    return NextResponse.json({
      success: true,
      activities: recentActivities,
    });
  } catch (error) {
    console.error("Error fetching dashboard activity:", error);

    return NextResponse.json({
      success: true,
      activities: [],
    });
  }
}
