import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Fetch all badges from database
    const { data: badges, error: badgesError } = await supabase
      .from('badges')
      .select('*')
      .order('level', { ascending: true });

    if (badgesError) {
      throw new Error(`Database error: ${badgesError.message}`);
    }

    if (!badges || badges.length === 0) {
      return NextResponse.json({
        success: true,
        badges: [],
        message: 'No badges found'
      });
    }

    return NextResponse.json({
      success: true,
      badges: badges.map(badge => ({
        id: badge.id,
        name: badge.name,
        level: badge.level,
        imageUrl: badge.image_url,
        description: badge.description,
      }))
    });
  } catch (error) {
    console.error('Error fetching badges:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch badges',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
