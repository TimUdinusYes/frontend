'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import BadgeDisplay from './BadgeDisplay';

interface Badge {
  id: number;
  name: string;
  level: number;
  imageUrl: string;
  description?: string;
}

interface BadgeCollectionProps {
  currentLevel: number;
}

export default function BadgeCollection({ currentLevel }: BadgeCollectionProps) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/badges');
      const data = await response.json();

      if (data.success) {
        setBadges(data.badges);
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-24 h-24 bg-gray-200 rounded-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Group badges by unique names
  const uniqueBadges: Badge[] = [];
  const seenNames = new Set<string>();

  badges.forEach(badge => {
    if (!seenNames.has(badge.name)) {
      seenNames.add(badge.name);
      uniqueBadges.push(badge);
    }
  });

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Badge Collection</h3>
        <p className="text-gray-600 text-sm">
          Kumpulkan semua badge dengan meningkatkan level kamu!
        </p>
      </div>

      {/* Badge Grid */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-6">
        {uniqueBadges.map((badge, index) => {
          const isUnlocked = currentLevel >= badge.level;

          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {isUnlocked ? (
                <BadgeDisplay
                  badgeId={badge.id}
                  badgeName={badge.name}
                  badgeImageUrl={badge.imageUrl}
                  level={badge.level}
                  size="medium"
                  showLabel={true}
                  animated={false}
                />
              ) : (
                <div className="flex flex-col items-center opacity-40 grayscale">
                  <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center shadow-lg border-4 border-gray-200 relative">
                    <div className="text-4xl">🔒</div>
                    <div className="absolute -bottom-2 -right-2 bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center border-2 border-gray-300">
                      <span className="text-xs font-bold text-gray-500">{badge.level}</span>
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <div className="text-sm font-bold text-gray-500">{badge.name}</div>
                    <div className="text-xs text-gray-400">Level {badge.level}</div>
                  </div>
                </div>
              )}

              {/* New badge indicator */}
              {isUnlocked && currentLevel === badge.level && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg"
                >
                  NEW!
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Progress Info */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">Badge Progress</div>
            <div className="text-lg font-bold text-gray-800">
              {uniqueBadges.filter(b => currentLevel >= b.level).length} / {uniqueBadges.length} Unlocked
            </div>
          </div>
          <div className="text-4xl">
            {currentLevel >= badges[badges.length - 1]?.level ? '🏆' : '🎯'}
          </div>
        </div>
      </div>
    </div>
  );
}
