'use client'

import { useState, useEffect, useCallback, TouchEvent } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Material, Topic, UserProfile, MaterialPage } from '@/types/database'
import { useMaterialTracking } from '@/app/TaskIntegrator/hooks/useMaterialTracking'
import Quiz from '@/components/Quiz'

export default function MaterialDetailPage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    
    // Decode material ID from base64 encoded 'ref' parameter
    const encodedRef = searchParams.get('ref')
    const materialId = encodedRef ? atob(encodedRef) : null

    const [loading, setLoading] = useState(true)
    const [material, setMaterial] = useState<Material | null>(null)
    const [topic, setTopic] = useState<Topic | null>(null)
    const [author, setAuthor] = useState<UserProfile | null>(null)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [userRole, setUserRole] = useState<string | null>(null)
    const [roleLoaded, setRoleLoaded] = useState(false)

    // Multi-page state
    const [pages, setPages] = useState<MaterialPage[]>([])
    const [currentPageIndex, setCurrentPageIndex] = useState(0)

    // Touch swipe state
    const [touchStart, setTouchStart] = useState<number | null>(null)
    const [touchEnd, setTouchEnd] = useState<number | null>(null)

    // Text-to-Speech state
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [speechRate, setSpeechRate] = useState(1)

    // Translation state
    const [showTranslation, setShowTranslation] = useState(false)
    const [translatedText, setTranslatedText] = useState('')
    const [translating, setTranslating] = useState(false)
    const [targetLanguage, setTargetLanguage] = useState('')

    // Quiz completion state - track which pages have been completed
    const [quizCompletedPages, setQuizCompletedPages] = useState<Set<number>>(new Set())
    const [correctAnswersCount, setCorrectAnswersCount] = useState(0)

    // Get current page content
    const currentPageContent = pages[currentPageIndex]?.content || material?.content || ''

    // Check if user is mentor (mentors can skip quizzes) - case insensitive
    const isMentor = userRole?.toLowerCase() === 'mentor'

    console.log('🎭 Role check:', { userRole, isMentor, roleLoaded })

    // Check if current page quiz is completed (or mentor who can skip)
    const isCurrentPageQuizCompleted = isMentor || quizCompletedPages.has(currentPageIndex)

    // Integrate material tracking
    const { markAsCompleted } = useMaterialTracking({
        materialId: materialId || '',
        materialTitle: material?.title || '',
        topicTitle: topic?.title || '',
        enabled: !!materialId && !!material && !!topic
    })

    const loadCurrentUser = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            setCurrentUserId(user.id)
            // Load role from user table (not user_profiles)
            const { data: userData, error } = await supabase
                .from('user')
                .select('role')
                .eq('id', user.id)
                .single()

            console.log('🔍 User role loaded:', { userId: user.id, userData, error })

            if (userData && userData.role) {
                setUserRole(userData.role)
                console.log('✅ Set userRole to:', userData.role)
            }
        }
        setRoleLoaded(true)
    }, [])

    const loadMaterial = useCallback(async () => {
        try {
            const { data: materialData, error: materialError } = await supabase
                .from('materials')
                .select('*')
                .eq('id', materialId)
                .single()

            if (materialError) throw materialError
            setMaterial(materialData)

            // Parse pages - use pages array if available, otherwise create from content
            if (materialData.pages && materialData.pages.length > 0) {
                setPages(materialData.pages)
            } else if (materialData.content) {
                // Legacy: split by page break marker or use as single page
                const pageBreakMarker = '<!-- PAGE BREAK -->'
                if (materialData.content.includes(pageBreakMarker)) {
                    const contentParts = materialData.content.split(pageBreakMarker)
                    setPages(contentParts.map((content: string, idx: number) => ({
                        page_number: idx + 1,
                        content: content.trim()
                    })))
                } else {
                    setPages([{ page_number: 1, content: materialData.content }])
                }
            }

            // Load topic
            if (materialData.topic_id) {
                const { data: topicData } = await supabase
                    .from('topics')
                    .select('*')
                    .eq('id', materialData.topic_id)
                    .single()
                setTopic(topicData)
            }

            // Load author
            if (materialData.created_by) {
                const { data: authorData } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('user_id', materialData.created_by)
                    .single()
                setAuthor(authorData)
            }

            // Load existing quiz scores for this material
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                try {
                    const res = await fetch(`/api/quiz/user-scores/${user.id}`)
                    const data = await res.json()
                    if (data.success && data.scores) {
                        const materialScore = data.scores.find((s: any) => s.material_id === Number(materialId))
                        if (materialScore) {
                            // Set the number of pages answered and correct count
                            const answeredPages = new Set<number>()
                            for (let i = 1; i <= materialScore.total_answered; i++) {
                                answeredPages.add(i - 1) // 0-indexed
                            }
                            setQuizCompletedPages(answeredPages)
                            setCorrectAnswersCount(materialScore.total_correct)
                        }
                    }
                } catch (err) {
                    console.error('Error loading quiz scores:', err)
                }
            }
        } catch (error) {
            console.error('Error loading material:', error)
        } finally {
            setLoading(false)
        }
    }, [materialId])

    useEffect(() => {
        if (materialId) {
            loadMaterial()
            loadCurrentUser()
        } else {
            setLoading(false)
        }
    }, [materialId, loadMaterial, loadCurrentUser])

    // Navigation functions
    const goToPrev = useCallback(() => {
        if (currentPageIndex > 0) {
            setCurrentPageIndex(prev => prev - 1)
            setShowTranslation(false)
            setTranslatedText('')
        }
    }, [currentPageIndex])

    const goToNext = useCallback(() => {
        // Mentors can navigate freely, students need quiz completion
        const canNavigate = isMentor || quizCompletedPages.has(currentPageIndex)
        if (currentPageIndex < pages.length - 1 && canNavigate) {
            setCurrentPageIndex(prev => prev + 1)
            setShowTranslation(false)
            setTranslatedText('')
        }
    }, [currentPageIndex, pages.length, quizCompletedPages, isMentor])

    // Handler for when quiz is completed
    const handleQuizCompleted = useCallback((isCorrect: boolean) => {
        setQuizCompletedPages(prev => {
            // Only update if not already completed
            if (!prev.has(currentPageIndex)) {
                if (isCorrect) {
                    setCorrectAnswersCount(c => c + 1)
                }
                return new Set([...prev, currentPageIndex])
            }
            return prev
        })
    }, [currentPageIndex])

    const goToPage = (index: number) => {
        setCurrentPageIndex(index)
        setShowTranslation(false)
        setTranslatedText('')
    }

    // Touch swipe handlers
    const minSwipeDistance = 50

    const onTouchStart = (e: TouchEvent) => {
        setTouchEnd(null)
        setTouchStart(e.targetTouches[0].clientX)
    }

    const onTouchMove = (e: TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX)
    }

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return
        const distance = touchStart - touchEnd
        // Only allow swipe to next page if quiz is completed
        if (distance > minSwipeDistance && quizCompletedPages.has(currentPageIndex)) goToNext()
        else if (distance < -minSwipeDistance) goToPrev()
    }

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') goToPrev()
            else if (e.key === 'ArrowRight') goToNext()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [goToPrev, goToNext])

    // Text-to-Speech functions
    const stripHtmlForSpeech = (html: string) => {
        return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    }

    const handleSpeak = () => {
        if (!currentPageContent) return

        if (isSpeaking) {
            window.speechSynthesis.cancel()
            setIsSpeaking(false)
            return
        }

        const textToSpeak = showTranslation ? translatedText : stripHtmlForSpeech(currentPageContent)
        const utterance = new SpeechSynthesisUtterance(textToSpeak)
        utterance.rate = speechRate
        utterance.lang = showTranslation ? 'en-US' : 'id-ID'

        utterance.onend = () => setIsSpeaking(false)
        utterance.onerror = () => setIsSpeaking(false)

        window.speechSynthesis.speak(utterance)
        setIsSpeaking(true)
    }

    // Translation function
    const handleTranslate = async () => {
        if (!currentPageContent || !targetLanguage.trim()) return

        setTranslating(true)
        try {
            const response = await fetch('/api/AI/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: stripHtmlForSpeech(currentPageContent),
                    targetLanguage: targetLanguage
                })
            })

            if (response.ok) {
                const data = await response.json()
                setTranslatedText(data.translatedText || data.translation)
                setShowTranslation(true)
            }
        } catch (error) {
            console.error('Translation error:', error)
        } finally {
            setTranslating(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    if (!material) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Materi Tidak Ditemukan</h2>
                        <button onClick={() => router.back()} className="text-indigo-600 hover:underline">
                            Kembali
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const isMultiPage = pages.length > 1
    const totalPages = pages.length

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            <div className="flex-1 w-[95vw] max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="mb-6 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Kembali
                </button>

                {/* Material Header */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-8">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
                        <div className="flex items-center gap-3 mb-4">
                            <span className={`px-4 py-1.5 rounded-full text-sm font-semibold uppercase tracking-wide ${material.material_type === 'video' ? 'bg-red-500/20 text-red-100' :
                                material.material_type === 'article' ? 'bg-blue-500/20 text-blue-100' :
                                    'bg-white/20 text-white'
                                }`}>
                                {material.material_type}
                            </span>
                            {material.status === 'draft' && (
                                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-100 rounded-full text-sm font-semibold">
                                    Draft
                                </span>
                            )}
                            {isMultiPage && (
                                <span className="px-3 py-1 bg-white/20 text-white rounded-full text-sm font-semibold">
                                    📄 {totalPages} Halaman
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                            {material.title}
                        </h1>
                        {topic && (
                            <p className="text-indigo-100">
                                Topik: {topic.title}
                            </p>
                        )}
                    </div>

                    {/* Meta info */}
                    <div className="px-8 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex flex-wrap items-center gap-6 mb-4">
                            <Link
                                href={currentUserId === material.created_by ? '/mentor/dashboard' : `/mentor/${material.created_by}`}
                                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                            >
                                {author?.avatar_url ? (
                                    <img src={author.avatar_url} alt={author.nama || 'Author'} className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                                        {(author?.nama || 'M').charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {currentUserId === material.created_by ? 'Anda' : (author?.nama || 'Mentor')}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Penulis</p>
                                </div>
                            </Link>

                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>{new Date(material.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}</span>
                            </div>
                        </div>

                        {/* Translation and Audio Controls */}
                        <div className="grid md:grid-cols-2 gap-4">
                            {/* Translation */}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Terjemahkan</span>
                                </div>
                                <input
                                    type="text"
                                    value={targetLanguage}
                                    onChange={(e) => setTargetLanguage(e.target.value)}
                                    placeholder="English, Jepang, dll"
                                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                                <button
                                    onClick={handleTranslate}
                                    disabled={translating || !targetLanguage.trim()}
                                    className="px-4 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
                                >
                                    {translating ? '...' : 'Go'}
                                </button>
                                {showTranslation && (
                                    <button
                                        onClick={() => setShowTranslation(false)}
                                        className="text-xs text-gray-500 hover:text-gray-700 underline"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>

                            {/* Audio */}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dengarkan</span>
                                </div>
                                <div className="flex gap-1">
                                    {[0.75, 1, 1.5, 2].map((rate) => (
                                        <button
                                            key={rate}
                                            onClick={() => setSpeechRate(rate)}
                                            className={`px-2 py-1 text-xs rounded font-medium ${speechRate === rate ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                                        >
                                            {rate}x
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={handleSpeak}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-medium text-white ${isSpeaking ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                                >
                                    {isSpeaking ? 'Stop' : 'Putar'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    {material.tags && material.tags.length > 0 && (
                        <div className="px-8 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex flex-wrap gap-2">
                                {material.tags.map((tag, index) => (
                                    <span key={index} className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium rounded-full">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Two Column Layout: Content (Left) + Quiz (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8 relative">
                    {/* Vertical Divider Line - Only visible on large screens */}
                    <div className="hidden lg:block absolute left-[60%] top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700"></div>

                    {/* Left Column - Material Content (3/5 width) */}
                    <div className="lg:col-span-3">
                        <div
                            className="sticky top-8 space-y-4"
                            onTouchStart={onTouchStart}
                            onTouchMove={onTouchMove}
                            onTouchEnd={onTouchEnd}
                        >
                            {/* Page Indicator (Top) */}
                            {isMultiPage && (
                                <div className="flex items-center justify-between py-3">
                                    <button
                                        onClick={goToPrev}
                                        disabled={currentPageIndex === 0}
                                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        Halaman {currentPageIndex + 1} dari {totalPages}
                                    </span>
                                    <button
                                        onClick={goToNext}
                                        disabled={currentPageIndex === totalPages - 1 || !isCurrentPageQuizCompleted}
                                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        title={!isCurrentPageQuizCompleted ? 'Jawab quiz terlebih dahulu' : ''}
                                    >
                                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            )}

                            {/* Content */}
                            <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                                <div
                                    className="prose prose-lg dark:prose-invert max-w-none material-content"
                                    dangerouslySetInnerHTML={{ __html: showTranslation ? translatedText : currentPageContent }}
                                />
                            </div>

                            {/* Navigation Section */}
                            {isMultiPage && (
                                <div className="py-4">
                                    {/* Dots Indicator */}
                                    <div className="flex justify-center gap-2">
                                        {pages.map((_, index) => {
                                            // Mentors can navigate to any page, students need quiz completion
                                            const canNavigate = isMentor || index <= currentPageIndex || quizCompletedPages.has(index - 1)
                                            return (
                                                <button
                                                    key={index}
                                                    onClick={() => canNavigate && goToPage(index)}
                                                    disabled={!canNavigate}
                                                    className={`w-3 h-3 rounded-full transition-all ${index === currentPageIndex
                                                        ? 'bg-indigo-600 scale-125'
                                                        : canNavigate
                                                            ? 'bg-gray-300 dark:bg-gray-600 hover:bg-indigo-400'
                                                            : 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed'
                                                        }`}
                                                    aria-label={`Go to page ${index + 1}`}
                                                />
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Quiz Section (2/5 width) */}
                    <div className="lg:col-span-2">
                        <div className="sticky top-8">
                            {/* Quiz Section - Only show for students (wait for role to load) */}
                            {material && currentUserId && roleLoaded && !isMentor ? (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Quiz</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Jawab pertanyaan di bawah untuk melanjutkan</p>
                                    </div>
                                    <Quiz
                                        materialId={material.id}
                                        pageNumber={currentPageIndex + 1}
                                        userId={currentUserId}
                                        onQuizCompleted={handleQuizCompleted}
                                    />

                                    {/* Next Page Button - Only show when quiz is completed and not on last page */}
                                    {isMultiPage && currentPageIndex < totalPages - 1 && (
                                        <div>
                                            {isCurrentPageQuizCompleted ? (
                                                <button
                                                    onClick={goToNext}
                                                    className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                                                >
                                                    Halaman Selanjutnya
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                            ) : (
                                                <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-3 px-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500">
                                                    Jawab quiz untuk lanjut ke halaman berikutnya
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-gray-500 dark:text-gray-400">Mentor tidak perlu mengerjakan quiz</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Completion Status - Only show on last page */}
                {(!isMultiPage || currentPageIndex === totalPages - 1) && (
                    <>
                        {/* For mentors - show simple completion */}
                        {isMentor ? (
                            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-lg p-6 mb-8 text-white">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">Selesai Mengajar?</h3>
                                            <p className="text-green-100 text-sm">Tandai materi ini selesai</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            markAsCompleted()
                                            router.push('/Multi-Source-Knowledge')
                                        }}
                                        className="px-6 py-3 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors flex items-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Tandai Selesai
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* For students - quiz-gated completion */
                            quizCompletedPages.size >= totalPages ? (
                                // All quizzes done - Show completion message and Kembali button
                                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-lg p-6 mb-8 text-white">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">Materi Selesai! 🎉</h3>
                                                <p className="text-green-100 text-sm">
                                                    Anda telah menyelesaikan semua quiz ({correctAnswersCount}/{totalPages} benar)
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                markAsCompleted()
                                                router.push('/Multi-Source-Knowledge')
                                            }}
                                            className="px-6 py-3 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors flex items-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                            </svg>
                                            Kembali
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // Not all quizzes done - Show remaining count
                                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl shadow-lg p-6 mb-8 text-white">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">Selesaikan Semua Quiz</h3>
                                            <p className="text-yellow-100 text-sm">
                                                Jawab quiz di setiap halaman untuk menandai materi selesai ({quizCompletedPages.size}/{totalPages} selesai)
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )
                        )}
                    </>
                )}

                {/* Source URL */}
                {material.url && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Sumber</h3>
                        <a
                            href={material.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            {material.url}
                        </a>
                    </div>
                )}
            </div>
        </div>
    )
}
