import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getUserLevelInfo } from "@/lib/levelSystem";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log("[DEBUG] Fetching stats for user:", userId);

    // Get user's total XP from all completed quizzes
    const { data: progressData, error: progressError } = await supabase
      .from("user_materials_quiz_progress")
      .select("xp_earned")
      .eq("user_id", userId);

    if (progressError) {
      console.error("[DEBUG] Progress error:", progressError);
      throw new Error(`Database error: ${progressError.message}`);
    }

    console.log("[DEBUG] Progress data:", progressData);

    // Calculate total XP
    const totalXP =
      progressData?.reduce((sum, record) => sum + (record.xp_earned || 0), 0) ||
      0;

    console.log("[DEBUG] Total XP:", totalXP);

    // Get level info
    const levelInfo = getUserLevelInfo(totalXP);
    console.log("[DEBUG] Level info:", levelInfo);

    // Auto-update user's badge based on current level
    const { data: badge, error: badgeError } = await supabase
      .from("badge")
      .select("*")
      .lte("level_min", levelInfo.level)
      .gte("level_max", levelInfo.level)
      .single();

    console.log("[DEBUG] Badge query result:", badge);
    console.log("[DEBUG] Badge error:", badgeError);

    // Update badge_id in user_profiles if badge found
    if (badge) {
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ badge_id: badge.badge_id })
        .eq("user_id", userId);

      console.log("[DEBUG] Badge update success, badge_id:", badge.badge_id);
      if (updateError) {
        console.error("[DEBUG] Update error:", updateError);
      }
    } else {
      console.log("[DEBUG] No badge found for level:", levelInfo.level);
    }

    // Get quiz stats
    const { data: allProgress } = await supabase
      .from("user_materials_quiz_progress")
      .select("is_completed, correct_answers, total_questions")
      .eq("user_id", userId);

    const totalQuizzes = allProgress?.length || 0;
    const completedQuizzes =
      allProgress?.filter((p) => p.is_completed).length || 0;
    const totalQuestionsAnswered =
      allProgress?.reduce((sum, p) => sum + (p.total_questions || 0), 0) || 0;
    const totalCorrectAnswers =
      allProgress?.reduce((sum, p) => sum + (p.correct_answers || 0), 0) || 0;

    const response = {
      success: true,
      stats: {
        ...levelInfo,
        badge: badge
          ? {
              id: badge.badge_id,
              name: badge.nama,
              imageUrl: badge.gambar,
              description: badge.description || null,
            }
          : null,
        totalQuizzes,
        completedQuizzes,
        totalQuestionsAnswered,
        totalCorrectAnswers,
        accuracy:
          totalQuestionsAnswered > 0
            ? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100)
            : 0,
      },
    };

    console.log("[DEBUG] Final response:", JSON.stringify(response, null, 2));

    return NextResponse.json(response);
  } catch (error) {
    console.error("[DEBUG] Error in stats endpoint:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch user stats",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
