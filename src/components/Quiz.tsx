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
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 animate-pulse">
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
            <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-red-100 dark:border-red-800">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Quiz Halaman {pageNumber}</h3>
                        <p className="text-sm text-red-600 dark:text-red-400">
                            {error || 'Quiz tidak tersedia'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={loadQuizAndScore}
                    className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all"
                >
                    Coba Lagi
                </button>
            </div>
        )
    }

    return (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Quiz Halaman {pageNumber}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {submitted ? 'Quiz telah dijawab' : 'Jawab quiz untuk lanjut ke halaman berikutnya'}
                    </p>
                </div>
            </div>

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
                            className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${submitted
                                ? showAsCorrect
                                    ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500'
                                    : showAsWrong
                                        ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500'
                                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 opacity-60'
                                : isSelected
                                    ? 'bg-indigo-100 dark:bg-indigo-900/30 border-2 border-indigo-500'
                                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
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
                    className={`w-full py-3 rounded-xl font-semibold transition-all ${selectedAnswer === null
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
                <div className={`p-4 rounded-xl ${result?.is_correct
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
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
