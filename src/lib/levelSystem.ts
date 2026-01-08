// Level System Configuration
// Level 1: 0-99 XP
// Level 2: 100-199 XP
// Level 3: 200-299 XP
// ... and so on

export const LEVEL_CONFIG = {
  MAX_LEVEL: 8,
  XP_PER_LEVEL: 100, // XP needed to reach each level
};

export const LEVEL_NAMES: Record<number, string> = {
  1: 'Pemula',
  2: 'Pemula',
  3: 'Amatir',
  4: 'Amatir',
  5: 'Basic',
  6: 'Basic',
  7: 'Pro',
  8: 'Ace',
};

export const BADGE_INFO: Record<number, { name: string; color: string; icon: string }> = {
  1: { name: 'Pemula', color: 'from-gray-400 to-gray-600', icon: '🌱' },
  2: { name: 'Pemula', color: 'from-gray-400 to-gray-600', icon: '🌱' },
  3: { name: 'Amatir', color: 'from-green-400 to-green-600', icon: '🌿' },
  4: { name: 'Amatir', color: 'from-green-400 to-green-600', icon: '🌿' },
  5: { name: 'Basic', color: 'from-blue-400 to-blue-600', icon: '⭐' },
  6: { name: 'Basic', color: 'from-blue-400 to-blue-600', icon: '⭐' },
  7: { name: 'Pro', color: 'from-purple-400 to-purple-600', icon: '💎' },
  8: { name: 'Ace', color: 'from-yellow-400 to-yellow-600', icon: '👑' },
};

/**
 * Calculate user level based on total XP
 * @param totalXP - Total XP earned by user
 * @returns Level number (1-8)
 */
export function calculateLevel(totalXP: number): number {
  const { MAX_LEVEL, XP_PER_LEVEL } = LEVEL_CONFIG;

  // Calculate level: each level requires 100 XP
  // Level 1: 0-99, Level 2: 100-199, etc.
  const level = Math.floor(totalXP / XP_PER_LEVEL) + 1;

  // Cap at max level
  return Math.min(level, MAX_LEVEL);
}

/**
 * Get XP required to reach next level
 * @param currentLevel - Current level
 * @returns XP needed for next level, or 0 if at max level
 */
export function getXPForNextLevel(currentLevel: number): number {
  const { MAX_LEVEL, XP_PER_LEVEL } = LEVEL_CONFIG;

  if (currentLevel >= MAX_LEVEL) {
    return 0; // Already at max level
  }

  return currentLevel * XP_PER_LEVEL;
}

/**
 * Get XP required for current level
 * @param currentLevel - Current level
 * @returns XP required to reach current level
 */
export function getXPForCurrentLevel(currentLevel: number): number {
  const { XP_PER_LEVEL } = LEVEL_CONFIG;

  if (currentLevel <= 1) {
    return 0;
  }

  return (currentLevel - 1) * XP_PER_LEVEL;
}

/**
 * Calculate progress within current level
 * @param totalXP - Total XP earned
 * @param currentLevel - Current level
 * @returns Object with current XP in level, XP needed for next level, and progress percentage
 */
export function getLevelProgress(totalXP: number, currentLevel: number) {
  const { MAX_LEVEL } = LEVEL_CONFIG;

  if (currentLevel >= MAX_LEVEL) {
    return {
      currentLevelXP: totalXP - getXPForCurrentLevel(currentLevel),
      xpForNextLevel: 0,
      progressPercentage: 100,
      isMaxLevel: true,
    };
  }

  const xpForCurrentLevel = getXPForCurrentLevel(currentLevel);
  const xpForNextLevel = getXPForNextLevel(currentLevel);

  const currentLevelXP = totalXP - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const progressPercentage = Math.floor((currentLevelXP / xpNeeded) * 100);

  return {
    currentLevelXP,
    xpNeeded,
    xpForNextLevel,
    progressPercentage: Math.min(progressPercentage, 100),
    isMaxLevel: false,
  };
}

/**
 * Get level name
 * @param level - Level number
 * @returns Level name in Indonesian
 */
export function getLevelName(level: number): string {
  return LEVEL_NAMES[level] || 'Unknown';
}

/**
 * Get all level info for a user
 * @param totalXP - Total XP earned
 * @returns Complete level information
 */
export function getUserLevelInfo(totalXP: number) {
  const level = calculateLevel(totalXP);
  const levelName = getLevelName(level);
  const progress = getLevelProgress(totalXP, level);

  return {
    level,
    levelName,
    totalXP,
    ...progress,
  };
}
