import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    // Fetch data from multiple endpoints to get real statistics
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

    // Process news data
    let newsStats = { total: 0, new: 0 };
    if (newsResponse.status === "fulfilled" && newsResponse.value.ok) {
      const newsData = await newsResponse.value.json();
      if (newsData.success && newsData.news) {
        const totalNews = newsData.news.length;
        const recentNews = newsData.news.filter((item: any) => {
          const createdAt = new Date(item.createdAt);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return createdAt > weekAgo;
        }).length;
        newsStats = { total: totalNews, new: recentNews };
      }
    }

    // Process users data
    let usersStats = { total: 0, new: 0 };
    if (usersResponse.status === "fulfilled" && usersResponse.value.ok) {
      const usersData = await usersResponse.value.json();
      if (usersData.success && usersData.users) {
        const totalUsers = usersData.users.length;
        const recentUsers = usersData.users.filter((user: any) => {
          const createdAt = new Date(user.createdAt);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return createdAt > weekAgo;
        }).length;
        usersStats = { total: totalUsers, new: recentUsers };
      }
    }

    // Process tournaments data
    let tournamentsStats = { total: 0, new: 0 };
    if (
      tournamentsResponse.status === "fulfilled" &&
      tournamentsResponse.value.ok
    ) {
      const tournamentsData = await tournamentsResponse.value.json();
      if (tournamentsData.success && tournamentsData.tournaments) {
        const totalTournaments = tournamentsData.tournaments.length;
        const recentTournaments = tournamentsData.tournaments.filter(
          (tournament: any) => {
            const createdAt = new Date(tournament.createdAt);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return createdAt > weekAgo;
          }
        ).length;
        tournamentsStats = { total: totalTournaments, new: recentTournaments };
      }
    }

    // Process profiles data
    let profilesStats = { total: 0, new: 0 };
    if (profilesResponse.status === "fulfilled" && profilesResponse.value.ok) {
      const profilesData = await profilesResponse.value.json();
      if (profilesData.success && profilesData.profiles) {
        const totalProfiles = profilesData.profiles.length;
        const recentProfiles = profilesData.profiles.filter((profile: any) => {
          const createdAt = new Date(profile.createdAt);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return createdAt > weekAgo;
        }).length;
        profilesStats = { total: totalProfiles, new: recentProfiles };
      }
    }

    const stats = {
      news: newsStats,
      users: usersStats,
      tournaments: tournamentsStats,
      profiles: profilesStats,
    };

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);

    return NextResponse.json({
      success: true,
      stats: {
        news: { total: 0, new: 0 },
        users: { total: 0, new: 0 },
        tournaments: { total: 0, new: 0 },
        profiles: { total: 0, new: 0 },
      },
    });
  }
}
