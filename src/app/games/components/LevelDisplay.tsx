"use client";

import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import BadgeDisplay from "./BadgeDisplay";

interface Badge {
  id: number;
  name: string;
  imageUrl: string;
  description?: string;
}

interface UserStats {
  level: number;
  levelName: string;
  totalXP: number;
  currentLevelXP: number;
  xpNeeded: number;
  xpForNextLevel: number;
  progressPercentage: number;
  isMaxLevel: boolean;
  badge?: Badge | null;
  totalQuizzes: number;
  completedQuizzes: number;
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  accuracy: number;
}

interface LevelDisplayProps {
  userId: string;
  compact?: boolean;
}

export default function LevelDisplay({
  userId,
  compact = false,
}: LevelDisplayProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    fetchUserStats();

    // Auto-refresh every 10 seconds to catch badge updates
    const interval = setInterval(() => {
      fetchUserStats();
    }, 10000);

    return () => clearInterval(interval);
  }, [userId]);

  const fetchUserStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/user/stats?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        console.log("[LevelDisplay] Stats updated:", {
          level: data.stats.level,
          badge: data.stats.badge,
          totalXP: data.stats.totalXP,
        });
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  if (compact) {
    return (
      <div className="bg-pink-300 rounded-xl border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 text-black">
        <div className="flex items-center gap-4 mb-2">
          {/* Badge */}
          <div className="flex-shrink-0">
            <div className="relative">
              <BadgeDisplay
                badgeId={stats.badge?.id}
                badgeName={stats.badge?.name}
                badgeImageUrl={stats.badge?.imageUrl}
                level={stats.level}
                size="small"
                showLabel={false}
                animated={false}
              />
            </div>
          </div>

          {/* Level Info */}
          <div className="flex-1">
            <div className="text-sm font-bold">Level {stats.level}</div>
            <div className="text-lg font-black">{stats.levelName}</div>
          </div>

          {/* XP */}
          <div className="text-right">
            <div className="text-2xl font-black">{stats.totalXP}</div>
            <div className="text-xs font-bold">Total XP</div>
          </div>
        </div>
        {!stats.isMaxLevel && (
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span>{stats.currentLevelXP} XP</span>
              <span>{stats.xpForNextLevel} XP</span>
            </div>
            <Progress
              value={stats.progressPercentage}
              className="h-4 max-w-sm mx-auto"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border-[3px] border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
      {/* Header */}
      <div className="bg-pink-300 p-6 text-black border-b-[3px] border-black">
        <div className="flex items-center gap-6 mb-4">
          {/* Badge */}
          <div className="flex-shrink-0">
            <BadgeDisplay
              badgeId={stats.badge?.id}
              badgeName={stats.badge?.name}
              badgeImageUrl={stats.badge?.imageUrl}
              level={stats.level}
              size="large"
              showLabel={false}
            />
          </div>

          {/* Level Info */}
          <div className="flex-1">
            <div className="text-sm font-bold mb-1">Level {stats.level}</div>
            <div className="text-3xl font-black mb-2">{stats.levelName}</div>
            <div className="text-right md:text-left">
              <div className="text-4xl font-black inline-block">
                {stats.totalXP}
              </div>
              <div className="text-sm font-bold inline-block ml-2">
                Total XP
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {!stats.isMaxLevel ? (
          <div>
            <div className="flex justify-between text-sm font-bold mb-2">
              <span>Level {stats.level}</span>
              <span>Level {stats.level + 1}</span>
            </div>
            <Progress
              value={stats.progressPercentage}
              className="h-5 max-w-xl mx-auto"
            />
            <div className="text-sm mt-2 text-center font-bold">
              {stats.currentLevelXP} / {stats.xpNeeded} XP (
              {stats.progressPercentage}%)
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <div className="text-2xl font-black mb-1">🏆 MAX LEVEL 🏆</div>
            <div className="text-sm font-bold">
              Anda telah mencapai level tertinggi!
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="p-6">
        <h3 className="text-lg font-black text-black mb-4">Statistik</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-200 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-4">
            <div className="text-2xl font-black text-black">
              {stats.completedQuizzes}
            </div>
            <div className="text-sm text-black/70 font-bold">Quiz Selesai</div>
          </div>
          <div className="bg-green-200 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-4">
            <div className="text-2xl font-black text-black">
              {stats.accuracy}%
            </div>
            <div className="text-sm text-black/70 font-bold">Akurasi</div>
          </div>
          <div className="bg-purple-200 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-4">
            <div className="text-2xl font-black text-black">
              {stats.totalCorrectAnswers}
            </div>
            <div className="text-sm text-black/70 font-bold">Jawaban Benar</div>
          </div>
          <div className="bg-orange-200 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-4">
            <div className="text-2xl font-black text-black">
              {stats.totalQuestionsAnswered}
            </div>
            <div className="text-sm text-black/70 font-bold">Total Soal</div>
          </div>
        </div>
      </div>
    </div>
  );
}
