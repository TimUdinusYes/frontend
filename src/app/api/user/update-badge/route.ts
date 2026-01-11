import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getUserLevelInfo } from "@/lib/levelSystem";
import { getBadgeByLevel } from "@/lib/badges";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get user's total XP from quiz progress
    const { data: progressData } = await supabase
      .from("user_materials_quiz_progress")
      .select("xp_earned")
      .eq("user_id", userId);

    const totalXP =
      progressData?.reduce((sum, record) => sum + (record.xp_earned || 0), 0) ||
      0;
    const levelInfo = getUserLevelInfo(totalXP);

    // Get appropriate badge for this level
    const badge = await getBadgeByLevel(levelInfo.level);

    if (!badge) {
      return NextResponse.json(
        { error: "Badge not found for user level" },
        { status: 404 }
      );
    }

    // Update user_profiles with new badge_id
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({ badge_id: badge.badge_id })
      .eq("user_id", userId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      badge: {
        id: badge.badge_id,
        name: badge.nama,
        imageUrl: badge.gambar,
      },
      level: levelInfo.level,
      levelName: levelInfo.levelName,
    });
  } catch (error) {
    console.error("Error updating user badge:", error);
    return NextResponse.json(
      { error: "Failed to update badge" },
      { status: 500 }
    );
  }
}
