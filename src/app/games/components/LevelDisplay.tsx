'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import BadgeDisplay from './BadgeDisplay';

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

export default function LevelDisplay({ userId, compact = false }: LevelDisplayProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserStats();
  }, [userId]);

  const fetchUserStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/user/stats?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
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
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 text-white">
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
            <div className="text-sm opacity-90">Level {stats.level}</div>
            <div className="text-lg font-bold">{stats.levelName}</div>
          </div>

          {/* XP */}
          <div className="text-right">
            <div className="text-2xl font-bold">{stats.totalXP}</div>
            <div className="text-xs opacity-90">Total XP</div>
          </div>
        </div>
        {!stats.isMaxLevel && (
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>{stats.currentLevelXP} XP</span>
              <span>{stats.xpForNextLevel} XP</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.progressPercentage}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-white rounded-full"
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
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
            <div className="text-sm opacity-90 mb-1">Level {stats.level}</div>
            <div className="text-3xl font-bold mb-2">{stats.levelName}</div>
            <div className="text-right md:text-left">
              <div className="text-4xl font-bold inline-block">{stats.totalXP}</div>
              <div className="text-sm opacity-90 inline-block ml-2">Total XP</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {!stats.isMaxLevel ? (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Level {stats.level}</span>
              <span>Level {stats.level + 1}</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.progressPercentage}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-white rounded-full"
              />
            </div>
            <div className="text-sm mt-2 text-center">
              {stats.currentLevelXP} / {stats.xpNeeded} XP ({stats.progressPercentage}%)
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <div className="text-2xl font-bold mb-1">🏆 MAX LEVEL 🏆</div>
            <div className="text-sm opacity-90">Anda telah mencapai level tertinggi!</div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Statistik</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.completedQuizzes}</div>
            <div className="text-sm text-gray-600">Quiz Selesai</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{stats.accuracy}%</div>
            <div className="text-sm text-gray-600">Akurasi</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.totalCorrectAnswers}</div>
            <div className="text-sm text-gray-600">Jawaban Benar</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.totalQuestionsAnswered}</div>
            <div className="text-sm text-gray-600">Total Soal</div>
          </div>
        </div>
      </div>
    </div>
  );
}
