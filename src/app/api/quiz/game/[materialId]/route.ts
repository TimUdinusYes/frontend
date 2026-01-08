import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Fetch quiz questions for a specific materi
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ materialId: string }> }
) {
  try {
    const { materialId } = await params;

    // Fetch questions with options from database
    let questions, questionsError;
    try {
      const result = await supabase
        .from('quiz_questions')
        .select(`
          id,
          question_number,
          question_text,
          quiz_options (
            id,
            option_letter,
            option_text
          )
        `)
        .eq('materials_id', materialId)
        .order('question_number', { ascending: true });
      
      questions = result.data;
      questionsError = result.error;
    } catch (e) {
      console.error('Error accessing quiz_questions table:', e);
      return NextResponse.json({
        success: false,
        error: 'Quiz questions table not found',
        message: 'Please generate questions first using /api/quiz/generate',
        materialId: materialId
      }, { status: 404 });
    }

    console.log('DEBUG - materialId:', materialId);
    console.log('DEBUG - questionsError:', questionsError);
    console.log('DEBUG - questions:', questions);

    if (questionsError) {
      console.error('Database error details:', questionsError);
      return NextResponse.json({
        error: 'Database error',
        details: questionsError.message,
        hint: questionsError.hint,
        code: questionsError.code
      }, { status: 500 });
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No quiz questions found for this material',
        message: 'Please generate questions first using /api/quiz/generate',
        materialId: materialId
      }, { status: 404 });
    }

    // Format the response
    const formattedQuestions = questions.map((q: any) => ({
      id: q.id,
      questionNumber: q.question_number,
      questionText: q.question_text,
      options: q.quiz_options
        .sort((a: any, b: any) => a.option_letter.localeCompare(b.option_letter))
        .map((opt: any) => ({
          id: opt.id,
          letter: opt.option_letter,
          text: opt.option_text
        }))
    }));

    return NextResponse.json({
      success: true,
      materialId,
      questions: formattedQuestions,
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch quiz questions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Submit quiz answer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ materialId: string }> }
) {
  try {
    const { materialId } = await params;
    const { userId, questionId, selectedOptionId } = await request.json();

    if (!userId || !questionId || !selectedOptionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. Check if the selected option is correct
    const { data: optionData, error: optionError } = await supabase
      .from('quiz_options')
      .select('is_correct, option_letter')
      .eq('id', selectedOptionId)
      .single();

    if (optionError || !optionData) {
      throw new Error('Invalid option ID');
    }

    const isCorrect = optionData.is_correct;

    // 2. Get correct option ID for response
    const { data: correctOption } = await supabase
      .from('quiz_options')
      .select('id')
      .eq('question_id', questionId)
      .eq('is_correct', true)
      .single();

    // 3. Save user answer (upsert)
    const { error: answerError } = await supabase
      .from('user_quiz_answers')
      .upsert({
        user_id: userId,
        question_id: questionId,
        selected_option_id: selectedOptionId,
        is_correct: isCorrect,
        answered_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,question_id'
      });

    if (answerError) {
      console.error('Error saving answer:', answerError);
    }

    // 4. Update or create progress
    const { data: existingProgress } = await supabase
      .from('user_materials_quiz_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('materials_id', materialId)
      .single();

    const xpPerQuestion = 5;
    const totalQuestions = 3;

    if (!existingProgress) {
      // Create new progress
      const { error: progressError } = await supabase
        .from('user_materials_quiz_progress')
        .insert({
          user_id: userId,
          materials_id: materialId,
          questions_answered: 1,
          correct_answers: isCorrect ? 1 : 0,
          total_questions: totalQuestions,
          is_completed: false,
          xp_earned: isCorrect ? xpPerQuestion : 0
        });

      if (progressError) {
        console.error('Error creating progress:', progressError);
      }
    } else {
      // Check if this is a retake (user already completed before)
      const isRetake = existingProgress.is_completed;

      let newAnswered: number;
      let newCorrect: number;

      if (isRetake) {
        // Reset counter for new attempt
        newAnswered = 1;
        newCorrect = isCorrect ? 1 : 0;
      } else {
        // Continue current attempt
        newAnswered = existingProgress.questions_answered + 1;
        newCorrect = existingProgress.correct_answers + (isCorrect ? 1 : 0);
      }

      const isCompleted = newAnswered >= totalQuestions;

      // Calculate XP based on best score
      // If this is a retake and completed, compare with previous best
      let finalXP: number;
      if (isCompleted && isRetake) {
        // Take the maximum between current attempt and previous best
        const currentAttemptXP = newCorrect * xpPerQuestion;
        const previousBestXP = existingProgress.xp_earned || 0;
        finalXP = Math.max(currentAttemptXP, previousBestXP);
      } else {
        // For ongoing attempt or first completion, use current score
        finalXP = newCorrect * xpPerQuestion;
      }

      const { error: updateError } = await supabase
        .from('user_materials_quiz_progress')
        .update({
          questions_answered: newAnswered,
          correct_answers: newCorrect,
          is_completed: isCompleted,
          xp_earned: finalXP,
          completed_at: isCompleted ? new Date().toISOString() : existingProgress.completed_at,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('materials_id', materialId);

      if (updateError) {
        console.error('Error updating progress:', updateError);
      }
    }

    return NextResponse.json({
      success: true,
      isCorrect,
      xpEarned: isCorrect ? xpPerQuestion : 0,
      correctOptionId: correctOption?.id || selectedOptionId,
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    return NextResponse.json(
      {
        error: 'Failed to submit answer',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}