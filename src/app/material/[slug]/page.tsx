'use client'

import { useState, useEffect, useCallback, TouchEvent } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Material, Topic, UserProfile, MaterialPage } from '@/types/database'
import Navbar from '@/components/Navbar'
import LoadingScreen from '@/components/LoadingScreen'
import { useMaterialTracking } from '@/app/TaskIntegrator/hooks/useMaterialTracking'

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

    // Get current page content
    const currentPageContent = pages[currentPageIndex]?.content || material?.content || ''

    // Integrate material tracking
    const { markAsCompleted } = useMaterialTracking({
        materialId: materialId || '',
        materialTitle: material?.title || '',
        topicTitle: topic?.title || '',
        enabled: !!materialId && !!material && !!topic
    })

    useEffect(() => {
        if (materialId) {
            loadMaterial()
            loadCurrentUser()
        } else {
            setLoading(false)
        }
    }, [materialId])

    const loadCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            setCurrentUserId(user.id)
        }
    }

    const loadMaterial = async () => {
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
        } catch (error) {
            console.error('Error loading material:', error)
        } finally {
            setLoading(false)
        }
    }

    // Navigation functions
    const goToPrev = useCallback(() => {
        if (currentPageIndex > 0) {
            setCurrentPageIndex(prev => prev - 1)
            setShowTranslation(false)
            setTranslatedText('')
        }
    }, [currentPageIndex])

    const goToNext = useCallback(() => {
        if (currentPageIndex < pages.length - 1) {
            setCurrentPageIndex(prev => prev + 1)
            setShowTranslation(false)
            setTranslatedText('')
        }
    }, [currentPageIndex, pages.length])

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
        if (distance > minSwipeDistance) goToNext()
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
        return <LoadingScreen loading={true} />
    }

    if (!material) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
                <Navbar />
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
            <Navbar />

            <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
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
                    <div className="px-8 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-6">
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

                {/* Content with Swipe Support */}
                <div
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-8"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    {/* Page Indicator (Top) */}
                    {isMultiPage && (
                        <div className="px-8 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={goToPrev}
                                    disabled={currentPageIndex === 0}
                                    className="p-2 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                    Halaman {currentPageIndex + 1} dari {totalPages}
                                </span>
                                <button
                                    onClick={goToNext}
                                    disabled={currentPageIndex === totalPages - 1}
                                    className="p-2 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-8">
                        <div
                            className="prose prose-lg dark:prose-invert max-w-none material-content"
                            dangerouslySetInnerHTML={{ __html: showTranslation ? translatedText : currentPageContent }}
                        />
                        <style jsx global>{`
              .material-content h1 { font-size: 2rem; font-weight: 700; margin: 1.5rem 0 1rem; }
              .material-content h2 { font-size: 1.5rem; font-weight: 600; margin: 1.25rem 0 0.75rem; }
              .material-content h3 { font-size: 1.25rem; font-weight: 600; margin: 1rem 0 0.5rem; }
              .material-content p { margin: 1rem 0; line-height: 1.75; }
              .material-content ul { list-style-type: disc; padding-left: 1.5rem; margin: 1rem 0; }
              .material-content ol { list-style-type: decimal; padding-left: 1.5rem; margin: 1rem 0; }
              .material-content li { margin: 0.5rem 0; display: list-item; }
              .material-content img { display: block; max-width: 100%; height: auto; border-radius: 0.75rem; margin: 1.5rem 0; }
              .material-content video { display: block !important; max-width: 100% !important; width: 100%; min-height: 200px; border-radius: 0.75rem; margin: 1.5rem 0; background: #000; }
              .material-content audio { display: block !important; width: 100% !important; margin: 1.5rem 0; }
              .material-content iframe { display: block !important; max-width: 100%; border-radius: 0.75rem; }
              .material-content .youtube-embed { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 1.5rem 0; border-radius: 0.75rem; background: #000; }
              .material-content .youtube-embed iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; border-radius: 0.75rem; }
              .material-content blockquote { border-left: 4px solid #6366f1; padding-left: 1.5rem; margin: 1.5rem 0; color: #6b7280; font-style: italic; }
              .material-content pre { background: #1f2937; color: #e5e7eb; padding: 1.5rem; border-radius: 0.75rem; overflow-x: auto; margin: 1.5rem 0; }
              .material-content code { background: #e5e7eb; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.875rem; }
              .material-content pre code { background: transparent; padding: 0; }
              .material-content a { color: #6366f1; text-decoration: underline; }
              .dark .material-content code { background: #374151; }
            `}</style>
                    </div>

                    {/* Dots Indicator */}
                    {isMultiPage && (
                        <div className="px-8 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-center gap-2">
                            {pages.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToPage(index)}
                                    className={`w-3 h-3 rounded-full transition-all ${index === currentPageIndex
                                        ? 'bg-indigo-600 scale-125'
                                        : 'bg-gray-300 dark:bg-gray-600 hover:bg-indigo-400'
                                        }`}
                                    aria-label={`Go to page ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Tools Section */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Translation */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Terjemahkan</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Terjemahkan halaman ini</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={targetLanguage}
                                onChange={(e) => setTargetLanguage(e.target.value)}
                                placeholder="English, Jepang, dll"
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <button
                                onClick={handleTranslate}
                                disabled={translating || !targetLanguage.trim()}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                            >
                                {translating ? '...' : 'Go'}
                            </button>
                        </div>
                        {showTranslation && (
                            <button
                                onClick={() => setShowTranslation(false)}
                                className="mt-2 text-sm text-gray-500 hover:text-gray-700"
                            >
                                Teks asli
                            </button>
                        )}
                    </div>

                    {/* Text-to-Speech */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Dengarkan</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{isSpeaking ? 'Memutar...' : 'Siap'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex gap-1">
                                {[0.75, 1, 1.5, 2].map((rate) => (
                                    <button
                                        key={rate}
                                        onClick={() => setSpeechRate(rate)}
                                        className={`px-2 py-1 text-xs rounded ${speechRate === rate ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                                    >
                                        {rate}x
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={handleSpeak}
                                className={`ml-auto px-4 py-2 rounded-lg ${isSpeaking ? 'bg-red-600' : 'bg-green-600'} text-white`}
                            >
                                {isSpeaking ? 'Stop' : 'Putar'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mark as Completed - Only show on last page */}
                {(!isMultiPage || currentPageIndex === totalPages - 1) && (
                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-lg p-6 mb-8 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">Selesai Belajar?</h3>
                                    <p className="text-green-100 text-sm">Tandai materi ini selesai</p>
                                </div>
                            </div>
                            <button
                                onClick={markAsCompleted}
                                className="px-6 py-3 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors"
                            >
                                Tandai Selesai
                            </button>
                        </div>
                    </div>
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
