import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface SubmitQuizBody {
    material_id: number
    page_number: number
    user_id: string
    selected_answer: number
}

export async function POST(request: NextRequest) {
    try {
        const body: SubmitQuizBody = await request.json()
        const { material_id, page_number, user_id, selected_answer } = body

        console.log('📝 Submit quiz request:', { material_id, page_number, user_id, selected_answer })

        if (!material_id || !page_number || !user_id || selected_answer === undefined) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
        }

        // Get correct answer from quiz
        const { data: quiz, error: quizError } = await supabase
            .from('material_page_quizzes')
            .select('correct_answer')
            .eq('material_id', material_id)
            .eq('page_number', page_number)
            .single()

        if (quizError || !quiz) {
            console.error('❌ Quiz not found:', quizError)
            return NextResponse.json({ success: false, error: 'Quiz not found' }, { status: 404 })
        }

        const isCorrect = quiz.correct_answer === selected_answer
        const pageKey = String(page_number)

        // Store both result and selected answer for history display
        const pageScoreData = {
            result: isCorrect ? 'benar' : 'salah',
            selected_answer: selected_answer,
            answered_at: new Date().toISOString()
        }

        console.log('📊 Answer check:', { correctAnswer: quiz.correct_answer, selectedAnswer: selected_answer, isCorrect })

        // Check if user already has a record for this material
        const { data: existingScore, error: fetchError } = await supabase
            .from('user_material_quiz_scores')
            .select('id, page_scores, total_correct, total_answered')
            .eq('user_id', user_id)
            .eq('material_id', material_id)
            .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('❌ Error fetching existing score:', fetchError)
        }

        let result

        if (existingScore) {
            // Update existing record
            const currentPageScores = existingScore.page_scores || {}
            const wasAlreadyAnswered = currentPageScores[pageKey] !== undefined
            const wasCorrectBefore = currentPageScores[pageKey]?.result === 'benar'

            // Update page_scores with new data format
            const updatedPageScores = {
                ...currentPageScores,
                [pageKey]: pageScoreData
            }

            // Calculate new totals
            let newTotalCorrect = existingScore.total_correct || 0
            let newTotalAnswered = existingScore.total_answered || 0

            if (!wasAlreadyAnswered) {
                // New answer
                newTotalAnswered += 1
                if (isCorrect) newTotalCorrect += 1
            } else {
                // Re-answer (update correct count if changed)
                if (wasCorrectBefore && !isCorrect) {
                    newTotalCorrect -= 1
                } else if (!wasCorrectBefore && isCorrect) {
                    newTotalCorrect += 1
                }
            }

            const { data: updateData, error: updateError } = await supabase
                .from('user_material_quiz_scores')
                .update({
                    page_scores: updatedPageScores,
                    total_correct: newTotalCorrect,
                    total_answered: newTotalAnswered
                })
                .eq('id', existingScore.id)
                .select()
                .single()

            if (updateError) {
                console.error('❌ Error updating score:', updateError)
                return NextResponse.json({ success: false, error: 'Failed to update score', details: updateError.message }, { status: 500 })
            }

            result = updateData
            console.log('✅ Score updated:', result)

        } else {
            // Insert new record
            const newPageScores = { [pageKey]: pageScoreData }

            const { data: insertData, error: insertError } = await supabase
                .from('user_material_quiz_scores')
                .insert({
                    user_id: user_id,
                    material_id: material_id,
                    page_scores: newPageScores,
                    total_correct: isCorrect ? 1 : 0,
                    total_answered: 1
                })
                .select()
                .single()

            if (insertError) {
                console.error('❌ Error inserting score:', insertError)
                return NextResponse.json({ success: false, error: 'Failed to save score', details: insertError.message }, { status: 500 })
            }

            result = insertData
            console.log('✅ Score inserted:', result)
        }

        return NextResponse.json({
            success: true,
            is_correct: isCorrect,
            correct_answer: quiz.correct_answer,
            selected_answer: selected_answer,
            saved: true
        })

    } catch (error: any) {
        console.error('❌ Submit quiz error:', error)
        return NextResponse.json({ success: false, error: 'Failed to submit quiz', details: error.message }, { status: 500 })
    }
}
