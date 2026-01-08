'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface BadgeDisplayProps {
  badgeId?: number;
  badgeName?: string;
  badgeImageUrl?: string;
  level: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  animated?: boolean;
}

export default function BadgeDisplay({
  badgeId,
  badgeName,
  badgeImageUrl,
  level,
  size = 'medium',
  showLabel = true,
  animated = true,
}: BadgeDisplayProps) {
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32',
  };

  const imageSizes = {
    small: 64,
    medium: 96,
    large: 128,
  };

  const BadgeContent = () => (
    <div className="flex flex-col items-center">
      {/* Badge Circle */}
      <div
        className={`${sizeClasses[size]} rounded-full bg-white
        flex items-center justify-center shadow-lg border-4 border-gray-200 relative
        transform hover:scale-110 transition-transform duration-300 overflow-hidden`}
      >
        {/* Badge Image */}
        {badgeImageUrl ? (
          <Image
            src={badgeImageUrl}
            alt={badgeName || `Level ${level} Badge`}
            width={imageSizes[size]}
            height={imageSizes[size]}
            className="object-contain p-2"
          />
        ) : (
          // Fallback placeholder
          <div className="text-4xl">🏅</div>
        )}

        {/* Level number badge */}
        <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full w-8 h-8 flex items-center justify-center border-2 border-white shadow-md">
          <span className="text-xs font-bold text-white">{level}</span>
        </div>
      </div>

      {/* Badge Name */}
      {showLabel && (
        <div className="mt-3 text-center">
          <div className="text-sm font-bold text-gray-800">{badgeName || 'Badge'}</div>
          <div className="text-xs text-gray-500">Level {level}</div>
        </div>
      )}
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
        }}
      >
        <BadgeContent />
      </motion.div>
    );
  }

  return <BadgeContent />;
}
