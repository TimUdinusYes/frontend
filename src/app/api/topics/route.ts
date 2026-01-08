import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Fetch all topics
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select(`
        id,
        title,
        description
      `)
      .order('created_at', { ascending: false });

    if (topicsError) {
      throw new Error(`Database error: ${topicsError.message}`);
    }

    if (!topics || topics.length === 0) {
      return NextResponse.json({
        success: true,
        topics: [],
        message: 'No topics found'
      });
    }

    // For each topic, get materials count and quiz progress stats
    const topicsWithStats = await Promise.all(
      topics.map(async (topic: any) => {
        // Count materials in this topic
        const { count: materialsCount } = await supabase
          .from('materials')
          .select('*', { count: 'exact', head: true })
          .eq('topic_id', topic.id)
          .eq('status', 'published');

        let completedCount = 0;
        let totalXP = 0;

        // Get user progress if userId provided
        if (userId && materialsCount && materialsCount > 0) {
          try {
            // Get all materials in this topic
            const { data: topicMaterials } = await supabase
              .from('materials')
              .select('id')
              .eq('topic_id', topic.id)
              .eq('status', 'published');

            if (topicMaterials && topicMaterials.length > 0) {
              const materialIds = topicMaterials.map((m: any) => m.id);

              // Get progress for these materials
              const { data: progressData } = await supabase
                .from('user_materials_quiz_progress')
                .select('is_completed, xp_earned, materials_id')
                .eq('user_id', userId)
                .in('materials_id', materialIds);

              if (progressData) {
                completedCount = progressData.filter((p: any) => p.is_completed).length;
                totalXP = progressData.reduce((sum: number, p: any) => sum + (p.xp_earned || 0), 0);
              }
            }
          } catch (e) {
            console.log('Error fetching user progress:', e);
          }
        }

        return {
          id: topic.id,
          title: topic.title,
          description: topic.description,
          materialsCount: materialsCount || 0,
          completedCount,
          totalXP,
        };
      })
    );

    return NextResponse.json({
      success: true,
      topics: topicsWithStats,
    });
  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch topics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
