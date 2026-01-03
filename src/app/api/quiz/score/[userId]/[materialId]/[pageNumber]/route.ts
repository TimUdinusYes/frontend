import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string; materialId: string; pageNumber: string }> }
) {
    try {
        const { userId, materialId, pageNumber } = await params
        const pageKey = pageNumber
        const materialIdNum = parseInt(materialId)
        const pageNum = parseInt(pageNumber)

        console.log('🔍 Checking quiz score:', { userId, materialId, pageNumber })

        // Get user's quiz scores for this material
        const { data: scoreRecord, error } = await supabase
            .from('user_material_quiz_scores')
            .select('page_scores, total_correct, total_answered')
            .eq('user_id', userId)
            .eq('material_id', materialIdNum)
            .single()

        if (error && error.code !== 'PGRST116') {
            console.error('❌ Error fetching score:', error)
        }

        if (!scoreRecord) {
            console.log('📭 No score record found')
            return NextResponse.json({ success: true, answered: false })
        }

        const pageScores = scoreRecord.page_scores || {}
        const pageData = pageScores[pageKey]

        if (pageData !== undefined) {
            // Also fetch the correct answer from the quiz
            const { data: quiz } = await supabase
                .from('material_page_quizzes')
                .select('correct_answer')
                .eq('material_id', materialIdNum)
                .eq('page_number', pageNum)
                .single()

            // Handle both old format (string) and new format (object)
            let isCorrect: boolean
            let selectedAnswer: number

            if (typeof pageData === 'string') {
                // Old format: "benar" or "salah"
                isCorrect = pageData === 'benar'
                selectedAnswer = -1 // Unknown in old format
            } else {
                // New format: { result: "benar", selected_answer: 2 }
                isCorrect = pageData.result === 'benar'
                selectedAnswer = pageData.selected_answer ?? -1
            }

            console.log('✅ Found answer for page:', { pageKey, isCorrect, selectedAnswer, correctAnswer: quiz?.correct_answer })

            return NextResponse.json({
                success: true,
                answered: true,
                score: {
                    is_correct: isCorrect,
                    selected_answer: selectedAnswer
                },
                correct_answer: quiz?.correct_answer ?? -1,
                total_correct: scoreRecord.total_correct,
                total_answered: scoreRecord.total_answered
            })
        } else {
            console.log('📭 Page not answered yet:', pageKey)
            return NextResponse.json({ success: true, answered: false })
        }

    } catch (error: any) {
        console.error('❌ Get quiz score error:', error)
        return NextResponse.json({ success: false, error: 'Failed to get quiz score' }, { status: 500 })
    }
}
