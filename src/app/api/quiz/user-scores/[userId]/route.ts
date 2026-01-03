import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET /api/quiz/user-scores/[userId] - Get all quiz scores for a user
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params

        // Get all quiz scores for the user
        const { data: scores, error } = await supabase
            .from('user_material_quiz_scores')
            .select('material_id, page_scores, total_correct, total_answered, updated_at')
            .eq('user_id', userId)

        if (error) {
            console.error('Error fetching user scores:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        // Also get the total number of pages for each material to check completion
        const materialIds = scores?.map(s => s.material_id) || []

        let materialPages: { [key: number]: number } = {}

        if (materialIds.length > 0) {
            const { data: materials } = await supabase
                .from('materials')
                .select('id, pages')
                .in('id', materialIds)

            if (materials) {
                materials.forEach(m => {
                    // Count pages (if pages array exists, use its length, otherwise 1)
                    materialPages[m.id] = m.pages?.length || 1
                })
            }
        }

        // Format response with completion status
        const formattedScores = scores?.map(score => {
            const totalPages = materialPages[score.material_id] || 1
            const answeredPages = Object.keys(score.page_scores || {}).length
            const isComplete = answeredPages >= totalPages

            return {
                material_id: score.material_id,
                total_correct: score.total_correct,
                total_answered: score.total_answered,
                total_pages: totalPages,
                is_complete: isComplete,
                updated_at: score.updated_at
            }
        }) || []

        return NextResponse.json({
            success: true,
            scores: formattedScores
        })

    } catch (error: any) {
        console.error('Get user scores error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
