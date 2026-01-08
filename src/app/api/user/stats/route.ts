import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserLevelInfo } from '@/lib/levelSystem';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user's total XP from all completed quizzes
    const { data: progressData, error: progressError } = await supabase
      .from('user_materials_quiz_progress')
      .select('xp_earned')
      .eq('user_id', userId);

    if (progressError) {
      throw new Error(`Database error: ${progressError.message}`);
    }

    // Calculate total XP
    const totalXP = progressData?.reduce((sum, record) => sum + (record.xp_earned || 0), 0) || 0;

    // Get level info
    const levelInfo = getUserLevelInfo(totalXP);

    // Get badge info from database based on level
    const { data: badge } = await supabase
      .from('badges')
      .select('*')
      .eq('level', levelInfo.level)
      .single();

    // Get quiz stats
    const { data: allProgress } = await supabase
      .from('user_materials_quiz_progress')
      .select('is_completed, correct_answers, total_questions')
      .eq('user_id', userId);

    const totalQuizzes = allProgress?.length || 0;
    const completedQuizzes = allProgress?.filter(p => p.is_completed).length || 0;
    const totalQuestionsAnswered = allProgress?.reduce((sum, p) => sum + (p.questions_answered || 0), 0) || 0;
    const totalCorrectAnswers = allProgress?.reduce((sum, p) => sum + (p.correct_answers || 0), 0) || 0;

    return NextResponse.json({
      success: true,
      stats: {
        ...levelInfo,
        badge: badge ? {
          id: badge.id,
          name: badge.name,
          imageUrl: badge.image_url,
          description: badge.description,
        } : null,
        totalQuizzes,
        completedQuizzes,
        totalQuestionsAnswered,
        totalCorrectAnswers,
        accuracy: totalQuestionsAnswered > 0
          ? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100)
          : 0,
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch user stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
