"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getUserLevelInfo } from "@/lib/levelSystem";
import BadgeDisplay from "./BadgeDisplay";

interface PlayerStats {
  rank: number;
  user_id: string;
  name: string;
  totalXP: number;
  level: number;
  badge: {
    name: string;
    imageUrl: string | null;
  } | null;
}

interface LeaderboardProps {
  currentUserId: string;
}

export default function Leaderboard({ currentUserId }: LeaderboardProps) {
  const [topPlayers, setTopPlayers] = useState<PlayerStats[]>([]);
  const [currentUserStats, setCurrentUserStats] = useState<PlayerStats | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [currentUserId]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      // Get all users' XP from quiz progress
      const { data: xpData, error: xpError } = await supabase
        .from("user_materials_quiz_progress")
        .select("user_id, xp_earned");

      if (xpError) throw xpError;

      // Aggregate XP per user
      const userXPMap = new Map<string, number>();
      xpData?.forEach((record) => {
        const current = userXPMap.get(record.user_id) || 0;
        userXPMap.set(record.user_id, current + (record.xp_earned || 0));
      });

      const userIds = Array.from(userXPMap.keys());
      if (userIds.length === 0) {
        setLoading(false);
        return;
      }

      // Get user profiles with badges
      const { data: profiles, error: profileError } = await supabase
        .from("user_profiles")
        .select(
          `
          user_id,
          nama,
          badge:badge_id (
            nama,
            gambar
          )
        `
        )
        .in("user_id", userIds);

      if (profileError) throw profileError;

      // Build player stats
      const allPlayers: PlayerStats[] = [];
      profiles?.forEach((profile: any) => {
        const totalXP = userXPMap.get(profile.user_id) || 0;
        const levelInfo = getUserLevelInfo(totalXP);

        allPlayers.push({
          rank: 0,
          user_id: profile.user_id,
          name: profile.nama || "Unknown",
          totalXP,
          level: levelInfo.level,
          badge: profile.badge
            ? {
                name: profile.badge.nama,
                imageUrl: profile.badge.gambar,
              }
            : null,
        });
      });

      // Sort by XP and assign ranks
      allPlayers.sort((a, b) => b.totalXP - a.totalXP);
      allPlayers.forEach((player, index) => {
        player.rank = index + 1;
      });

      // Get top 5
      setTopPlayers(allPlayers.slice(0, 5));

      // Find current user
      const currentUser = allPlayers.find((p) => p.user_id === currentUserId);
      setCurrentUserStats(currentUser || null);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent"></div>
          <span className="ml-3 font-black text-black">Loading...</span>
        </div>
      </div>
    );
  }

  const isCurrentUserInTop5 = topPlayers.some(
    (p) => p.user_id === currentUserId
  );

  const rankColors = [
    "from-yellow-200 to-yellow-300",
    "from-gray-200 to-gray-300",
    "from-orange-200 to-orange-300",
    "from-blue-100 to-blue-200",
    "from-purple-100 to-purple-200",
  ];
  const rankEmojis = ["🥇", "🥈", "🥉", "👍", "👍"];

  return (
    <div className="bg-white rounded-xl border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 p-4 border-b-[3px] border-black">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🏆</span>
          <div>
            <h3 className="text-2xl font-black text-black">Leaderboard</h3>
            <p className="text-xs font-bold text-black/70">
              Top 5 Pemain Terbaik
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {topPlayers.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">🎮</div>
            <p className="text-lg font-black text-black">Belum ada pemain</p>
            <p className="text-sm font-bold text-black/60">
              Jadilah yang pertama!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Top 5 */}
            {topPlayers.map((player, index) => {
              const isCurrentUser = player.user_id === currentUserId;
              return (
                <div
                  key={player.user_id}
                  className={`bg-gradient-to-r ${
                    rankColors[index]
                  } rounded-lg border-[2px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-3 ${
                    isCurrentUser ? "ring-2 ring-green-500" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank */}
                    <div className="text-3xl flex-shrink-0">
                      {rankEmojis[index]}
                    </div>

                    {/* Badge */}
                    <div className="flex-shrink-0">
                      <BadgeDisplay
                        badgeId={player.badge?.name ? 1 : undefined}
                        badgeName={player.badge?.name}
                        badgeImageUrl={player.badge?.imageUrl ?? undefined}
                        level={player.level}
                        size="small"
                        showLabel={false}
                        animated={false}
                      />
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-base text-black truncate">
                        {player.name}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs bg-green-400 px-2 py-0.5 rounded-full border border-black">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-black/70">
                        Level {player.level}
                      </div>
                    </div>

                    {/* XP */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-xl font-black text-black">
                        {player.totalXP}
                      </div>
                      <div className="text-xs font-bold text-black/60">XP</div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Current User (if not in top 5) */}
            {!isCurrentUserInTop5 && currentUserStats && (
              <>
                <div className="flex items-center gap-2 py-2">
                  <div className="flex-1 h-px bg-black/20"></div>
                  <span className="text-xs font-bold text-black/50">
                    Peringkat Kamu
                  </span>
                  <div className="flex-1 h-px bg-black/20"></div>
                </div>

                <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-lg border-[2px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-3 ring-2 ring-green-500">
                  <div className="flex items-center gap-3">
                    {/* Rank Number */}
                    <div className="text-2xl font-black text-black flex-shrink-0">
                      #{currentUserStats.rank}
                    </div>

                    {/* Badge */}
                    <div className="flex-shrink-0">
                      <BadgeDisplay
                        badgeId={currentUserStats.badge?.name ? 1 : undefined}
                        badgeName={currentUserStats.badge?.name}
                        badgeImageUrl={
                          currentUserStats.badge?.imageUrl ?? undefined
                        }
                        level={currentUserStats.level}
                        size="small"
                        showLabel={false}
                        animated={false}
                      />
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-base text-black truncate">
                        {currentUserStats.name}
                        <span className="ml-2 text-xs bg-green-400 px-2 py-0.5 rounded-full border border-black">
                          YOU
                        </span>
                      </div>
                      <div className="text-xs font-bold text-black/70">
                        Level {currentUserStats.level}
                      </div>
                    </div>

                    {/* XP */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-xl font-black text-black">
                        {currentUserStats.totalXP}
                      </div>
                      <div className="text-xs font-bold text-black/60">XP</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
