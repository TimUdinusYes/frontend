'use client'

import { useState, useEffect } from 'react'

interface QuizProps {
    materialId: number
    pageNumber: number
    userId: string
    onQuizCompleted: (isCorrect: boolean) => void
}

interface QuizData {
    id: number
    question: string
    options: string[]
}

interface QuizScore {
    answered: boolean
    score?: {
        is_correct: boolean
        selected_answer: number
    }
    correct_answer?: number // Actual correct answer index from quiz
}

export default function Quiz({ materialId, pageNumber, userId, onQuizCompleted }: QuizProps) {
    const [quiz, setQuiz] = useState<QuizData | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
    const [submitted, setSubmitted] = useState(false)
    const [result, setResult] = useState<{ is_correct: boolean; correct_answer: number } | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Reset all state when page changes
    useEffect(() => {
        // Reset state immediately when page changes
        setQuiz(null)
        setSelectedAnswer(null)
        setSubmitted(false)
        setResult(null)
        setError(null)
        setLoading(true)

        loadQuizAndScore()
    }, [materialId, pageNumber, userId])

    const loadQuizAndScore = async () => {
        setLoading(true)
        setError(null)
        try {
            // First get the quiz data
            const quizRes = await fetch(`/api/quiz/${materialId}/${pageNumber}`)
            const quizData = await quizRes.json()

            if (quizData.success && quizData.quiz) {
                setQuiz(quizData.quiz)
            } else {
                setError('Gagal memuat quiz')
                setLoading(false)
                return
            }

            // Then check if already answered
            const scoreRes = await fetch(`/api/quiz/score/${userId}/${materialId}/${pageNumber}`)
            const scoreData: QuizScore = await scoreRes.json()

            console.log('📊 Score data loaded:', scoreData)

            if (scoreData.answered && scoreData.score) {
                setSubmitted(true)
                setSelectedAnswer(scoreData.score.selected_answer)
                // Use correct_answer from API (not selected_answer!)
                setResult({
                    is_correct: scoreData.score.is_correct,
                    correct_answer: scoreData.correct_answer ?? -1
                })
                onQuizCompleted(scoreData.score.is_correct)
            }
        } catch (err) {
            console.error('Error loading quiz:', err)
            setError('Gagal memuat quiz. Silakan refresh halaman.')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (selectedAnswer === null || !quiz) return

        setSubmitting(true)
        try {
            // Submit answer - use Next.js API route
            const res = await fetch(`/api/quiz/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    material_id: materialId,
                    page_number: pageNumber,
                    user_id: userId,
                    selected_answer: selectedAnswer
                })
            })

            const data = await res.json()
            console.log('📤 Submit response:', data)

            if (data.success) {
                setResult({
                    is_correct: data.is_correct,
                    correct_answer: data.correct_answer
                })
                setSubmitted(true)
                onQuizCompleted(data.is_correct)
            } else {
                console.error('❌ Submit failed:', data)
                setError(data.error || 'Gagal mengirim jawaban')
            }
        } catch (err) {
            console.error('Error submitting quiz:', err)
            setError('Gagal mengirim jawaban. Silakan coba lagi.')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
                <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    ))}
                </div>
            </div>
        )
    }

    if (error || !quiz) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                        <p className="text-sm text-red-600 dark:text-red-400">
                            {error || 'Quiz tidak tersedia'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={loadQuizAndScore}
                    className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all"
                >
                    Coba Lagi
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <p className="text-gray-800 dark:text-gray-200 font-medium mb-4">{quiz.question}</p>

            <div className="space-y-3 mb-6">
                {quiz.options.map((option, index) => {
                    const isSelected = selectedAnswer === index
                    const isCorrectAnswer = result?.correct_answer === index
                    const showAsCorrect = submitted && isCorrectAnswer
                    const showAsWrong = submitted && isSelected && !result?.is_correct

                    return (
                        <label
                            key={index}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${submitted
                                ? showAsCorrect
                                    ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500'
                                    : showAsWrong
                                        ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500'
                                        : 'bg-gray-50 dark:bg-gray-800/50 opacity-60'
                                : isSelected
                                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500'
                                    : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                        >
                            <input
                                type="radio"
                                name="quiz-answer"
                                value={index}
                                checked={isSelected}
                                onChange={() => !submitted && setSelectedAnswer(index)}
                                disabled={submitted}
                                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className={`flex-1 ${showAsCorrect ? 'text-green-700 dark:text-green-300 font-medium' :
                                showAsWrong ? 'text-red-700 dark:text-red-300' :
                                    'text-gray-700 dark:text-gray-300'
                                }`}>
                                {String.fromCharCode(65 + index)}. {option}
                            </span>
                            {showAsCorrect && (
                                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            )}
                            {showAsWrong && (
                                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            )}
                        </label>
                    )
                })}
            </div>

            {!submitted ? (
                <button
                    onClick={handleSubmit}
                    disabled={selectedAnswer === null || submitting}
                    className={`w-full py-3 rounded-lg font-semibold transition-all ${selectedAnswer === null
                        ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                >
                    {submitting ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Mengirim...
                        </span>
                    ) : (
                        'Answer'
                    )}
                </button>
            ) : (
                <div className={`p-3 rounded-lg border-l-4 ${result?.is_correct
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-800 dark:text-green-200'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-800 dark:text-red-200'
                    }`}>
                    <div className="flex items-center gap-2">
                        {result?.is_correct ? (
                            <>
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="font-medium">Jawaban Benar! 🎉</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span className="font-medium">Jawaban Salah. Lihat jawaban yang benar di atas.</span>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
