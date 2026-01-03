import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { createClient } from '@supabase/supabase-js'

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || ''
})

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface QuizQuestion {
    question: string
    options: string[]
    correct_answer: number
}

async function generateQuizFromContent(content: string, pageNumber: number): Promise<QuizQuestion> {
    try {
        const cleanContent = content
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 3000)

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `Kamu adalah pembuat soal quiz untuk materi pembelajaran. Tugas kamu adalah membuat SATU soal pilihan ganda berdasarkan HANYA dari konten materi yang diberikan.

ATURAN PENTING:
1. Soal HARUS berdasarkan informasi yang ada di dalam materi
2. Jawaban yang benar HARUS ada di dalam materi, jangan membuat informasi baru
3. Buat 4 pilihan jawaban (A, B, C, D)
4. Pastikan hanya ada SATU jawaban yang benar
5. Pilihan jawaban yang salah harus masuk akal tapi jelas salah berdasarkan materi
6. Gunakan Bahasa Indonesia

Jawab HANYA dalam format JSON yang valid:
{
  "question": "Pertanyaan berdasarkan materi",
  "options": ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
  "correct_answer": 0
}

Catatan: correct_answer adalah index (0-3) dari jawaban yang benar di array options.`
                },
                {
                    role: 'user',
                    content: `Buatkan 1 soal pilihan ganda untuk halaman ${pageNumber} berdasarkan materi berikut:

${cleanContent}`
                }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.3,
            max_tokens: 500
        })

        const responseText = completion.choices[0]?.message?.content || ''
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)

        if (!jsonMatch) {
            return createDefaultQuiz(pageNumber)
        }

        const result = JSON.parse(jsonMatch[0]) as QuizQuestion

        if (!result.question || !result.options || result.options.length !== 4 ||
            typeof result.correct_answer !== 'number' || result.correct_answer < 0 || result.correct_answer > 3) {
            return createDefaultQuiz(pageNumber)
        }

        return result
    } catch (error) {
        console.error('Quiz generation error:', error)
        return createDefaultQuiz(pageNumber)
    }
}

function createDefaultQuiz(pageNumber: number): QuizQuestion {
    return {
        question: `Apa yang telah Anda pelajari dari halaman ${pageNumber} materi ini?`,
        options: [
            'Saya memahami konsep dasar yang dijelaskan',
            'Saya belum membaca materi dengan teliti',
            'Materi ini terlalu sulit dipahami',
            'Saya perlu membaca ulang materi ini'
        ],
        correct_answer: 0
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ materialId: string; pageNumber: string }> }
) {
    try {
        const { materialId, pageNumber } = await params
        const materialIdNum = parseInt(materialId)
        const pageNum = parseInt(pageNumber)

        if (isNaN(materialIdNum) || isNaN(pageNum)) {
            return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 })
        }

        // Check if quiz exists in database
        const { data: existingQuiz } = await supabase
            .from('material_page_quizzes')
            .select('id, question, options, correct_answer')
            .eq('material_id', materialIdNum)
            .eq('page_number', pageNum)
            .single()

        if (existingQuiz) {
            console.log('✅ Quiz found in DB for material:', materialIdNum, 'page:', pageNum)
            return NextResponse.json({
                success: true,
                quiz: {
                    id: existingQuiz.id,
                    question: existingQuiz.question,
                    options: existingQuiz.options
                },
                fromDatabase: true
            })
        }

        // Get material content
        const { data: material, error: materialError } = await supabase
            .from('materials')
            .select('pages, content')
            .eq('id', materialIdNum)
            .single()

        if (materialError || !material) {
            return NextResponse.json({ success: false, error: 'Material not found' }, { status: 404 })
        }

        // Get page content
        let pageContent = ''
        if (material.pages && material.pages.length >= pageNum) {
            const page = material.pages.find((p: { page_number: number }) => p.page_number === pageNum)
            pageContent = page?.content || material.pages[pageNum - 1]?.content || ''
        } else if (pageNum === 1 && material.content) {
            pageContent = material.content
        }

        if (!pageContent) {
            return NextResponse.json({ success: false, error: 'Page content not found' }, { status: 404 })
        }

        // Generate quiz using AI
        console.log('🔄 Generating quiz for material:', materialIdNum, 'page:', pageNum)
        const generatedQuiz = await generateQuizFromContent(pageContent, pageNum)

        // Save to database
        const { data: savedQuiz, error: saveError } = await supabase
            .from('material_page_quizzes')
            .insert({
                material_id: materialIdNum,
                page_number: pageNum,
                question: generatedQuiz.question,
                options: generatedQuiz.options,
                correct_answer: generatedQuiz.correct_answer
            })
            .select('id')
            .single()

        if (saveError) {
            console.error('Error saving quiz:', saveError)
        } else {
            console.log('💾 Quiz saved to DB with id:', savedQuiz?.id)
        }

        return NextResponse.json({
            success: true,
            quiz: {
                id: savedQuiz?.id || 0,
                question: generatedQuiz.question,
                options: generatedQuiz.options
            },
            generated: true
        })

    } catch (error) {
        console.error('Get quiz error:', error)
        return NextResponse.json({ success: false, error: 'Failed to get quiz' }, { status: 500 })
    }
}
