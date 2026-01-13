import { supabase } from "./supabase";
import type { Badge } from "@/types/database";

/**
 * Fix badge image URL extension from .jpg to .png
 * @param badge - Badge object
 * @returns Badge with corrected image URL
 */
function fixBadgeImageUrl(badge: Badge): Badge {
  if (badge.gambar && badge.gambar.endsWith('.jpg')) {
    return {
      ...badge,
      gambar: badge.gambar.replace(/\.jpg$/, '.png')
    };
  }
  return badge;
}

/**
 * Fetch a badge by its ID from the badge table
 * @param badgeId - The badge ID to fetch
 * @returns Badge object or null if not found
 */
export async function getBadgeById(badgeId: number): Promise<Badge | null> {
  const { data, error } = await supabase
    .from("badge")
    .select("*")
    .eq("badge_id", badgeId)
    .single();

  if (error) {
    console.error("Error fetching badge:", error);
    return null;
  }

  return data ? fixBadgeImageUrl(data) : null;
}

/**
 * Fetch all available badges
 * @returns Array of all badges
 */
export async function getAllBadges(): Promise<Badge[]> {
  const { data, error } = await supabase
    .from("badge")
    .select("*")
    .order("badge_id", { ascending: true });

  if (error) {
    console.error("Error fetching badges:", error);
    return [];
  }

  return data ? data.map(fixBadgeImageUrl) : [];
}

/**
 * Get the appropriate badge for a given level
 * @param level - User's current level
 * @returns Badge object or null if not found
 */
export async function getBadgeByLevel(level: number): Promise<Badge | null> {
  const { data, error } = await supabase
    .from("badge")
    .select("*")
    .lte("level_min", level)
    .gte("level_max", level)
    .single();

  if (error) {
    console.error("Error fetching badge by level:", error);
    return null;
  }

  return data ? fixBadgeImageUrl(data) : null;
}

/**
 * Get all unlocked badges for a given level
 * @param level - User's current level
 * @returns Array of Badge objects that are unlocked at this level
 */
export async function getUnlockedBadgesByLevel(level: number): Promise<Badge[]> {
  const { data, error } = await supabase
    .from("badge")
    .select("*")
    .lte("level_min", level)
    .order("level_min", { ascending: true });

  if (error) {
    console.error("Error fetching unlocked badges:", error);
    return [];
  }

  const fixedBadges = data ? data.map(fixBadgeImageUrl) : [];
  console.log(`[DEBUG] User level: ${level}, Unlocked badges:`, fixedBadges);
  return fixedBadges;
}

/**
 * Get user's total XP from quiz progress
 * @param userId - User ID
 * @returns Total XP earned
 */
export async function getUserTotalXP(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("user_materials_quiz_progress")
    .select("xp_earned")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching user XP:", error);
    return 0;
  }

  const totalXP = data?.reduce((sum, record) => sum + (record.xp_earned || 0), 0) || 0;
  return totalXP;
}
