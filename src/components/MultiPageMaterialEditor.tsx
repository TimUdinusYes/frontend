'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { MaterialPage } from '@/types/database'
import type { UploadResult } from '@/lib/storage'

// Dynamic imports
const RichTextEditor = dynamic(() => import('./RichTextEditor'), {
    ssr: false,
    loading: () => (
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 min-h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
    )
})

const MediaUploader = dynamic(() => import('./MediaUploader'), { ssr: false })
const YouTubeEmbed = dynamic(() => import('./YouTubeEmbed'), { ssr: false })

interface MultiPageMaterialEditorProps {
    pages: MaterialPage[]
    onChange: (pages: MaterialPage[]) => void
    cacheKey?: string
    disabled?: boolean
    userId: string
}

// Local storage cache helpers
const getCachedPages = (key: string): MaterialPage[] | null => {
    if (typeof window === 'undefined') return null
    try {
        const cached = localStorage.getItem(`material_draft_${key}`)
        return cached ? JSON.parse(cached) : null
    } catch {
        return null
    }
}

const setCachedPages = (key: string, pages: MaterialPage[]) => {
    if (typeof window === 'undefined') return
    try {
        localStorage.setItem(`material_draft_${key}`, JSON.stringify(pages))
    } catch (e) {
        console.error('Failed to cache pages:', e)
    }
}

const clearCachedPages = (key: string) => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(`material_draft_${key}`)
}

export default function MultiPageMaterialEditor({
    pages: initialPages,
    onChange,
    cacheKey = 'default',
    disabled = false,
    userId
}: MultiPageMaterialEditorProps) {
    // Initialize with at least one page
    const [pages, setPages] = useState<MaterialPage[]>(() => {
        // Try to restore from cache first (only if no initial pages provided)
        if (initialPages.length === 0) {
            const cached = getCachedPages(cacheKey)
            if (cached && cached.length > 0) return cached
        }
        // Use initial pages or create empty first page
        return initialPages.length > 0 ? initialPages : [{ page_number: 1, content: '' }]
    })

    const [currentPageIndex, setCurrentPageIndex] = useState(0)
    const [showCacheRestored, setShowCacheRestored] = useState(false)
    const [showMediaUploader, setShowMediaUploader] = useState(false)

    const handleContentChange = useCallback((content: string) => {
        setPages(prev => prev.map((page, idx) =>
            idx === currentPageIndex ? { ...page, content } : page
        ))
    }, [currentPageIndex])

    const insertMediaToCurrentPage = useCallback((html: string) => {
        setPages(prev => prev.map((page, idx) => {
            if (idx === currentPageIndex) {
                return { ...page, content: page.content + '\n' + html }
            }
            return page
        }))
    }, [currentPageIndex])

    const addPage = useCallback(() => {
        const newPageNumber = pages.length + 1
        setPages(prev => [...prev, { page_number: newPageNumber, content: '' }])
        setCurrentPageIndex(pages.length) // Go to new page
    }, [pages])

    const deletePage = useCallback(() => {
        if (pages.length <= 1) return
        setPages(prev => {
            const newPages = prev.filter((_, idx) => idx !== currentPageIndex)
            return newPages.map((page, idx) => ({ ...page, page_number: idx + 1 }))
        })
        setCurrentPageIndex(Math.max(0, currentPageIndex - 1))
    }, [pages, currentPageIndex])

    const goToPrev = useCallback(() => {
        if (currentPageIndex > 0) setCurrentPageIndex(prev => prev - 1)
    }, [currentPageIndex])

    const goToNext = useCallback(() => {
        if (currentPageIndex < pages.length - 1) setCurrentPageIndex(prev => prev + 1)
    }, [currentPageIndex, pages.length])

    const goToPage = useCallback((index: number) => {
        setCurrentPageIndex(index)
    }, [])

    const clearCache = useCallback(() => {
        clearCachedPages(cacheKey)
    }, [cacheKey])

    // Check if cache was restored on mount
    useEffect(() => {
        if (initialPages.length === 0) {
            const cached = getCachedPages(cacheKey)
            if (cached && cached.length > 0) {
                setShowCacheRestored(true)
                setTimeout(() => setShowCacheRestored(false), 3000)
            }
        }
    }, [])

    // Sync with initialPages when they change (for edit mode)
    useEffect(() => {
        if (initialPages.length > 0 && pages.length <= 1 && !pages[0]?.content) {
            setPages(initialPages)
        }
    }, [initialPages])

    // Save to cache whenever pages change
    useEffect(() => {
        setCachedPages(cacheKey, pages)
        onChange(pages)
    }, [pages, cacheKey, onChange])

    const handleMediaUpload = useCallback((result: UploadResult) => {
        if (result.fileType === 'image') {
            const imageHtml = `<img src="${result.url}" alt="${result.fileName}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0;" />`
            insertMediaToCurrentPage(imageHtml)
        } else if (result.fileType === 'video') {
            const videoHtml = `<video src="${result.url}" controls style="max-width: 100%; border-radius: 8px; margin: 16px 0;"></video>`
            insertMediaToCurrentPage(videoHtml)
        } else if (result.fileType === 'audio') {
            const audioHtml = `<audio src="${result.url}" controls style="width: 100%; margin: 16px 0;"></audio>`
            insertMediaToCurrentPage(audioHtml)
        }
    }, [insertMediaToCurrentPage])

    const currentPage = pages[currentPageIndex]
    const totalPages = pages.length

    return (
        <div className="space-y-4">
            {/* Cache restored notification */}
            {showCacheRestored && (
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-blue-700 dark:text-blue-300">
                        Draft sebelumnya berhasil dipulihkan dari cache lokal
                    </span>
                </div>
            )}

            {/* Page Navigation Header */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    {/* Left: Navigation */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={goToPrev}
                            disabled={currentPageIndex === 0 || disabled}
                            className="p-2 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7" />
                            </svg>
                        </button>

                        <div className="text-center min-w-[120px]">
                            <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                                Halaman {currentPageIndex + 1} dari {totalPages}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={goToNext}
                            disabled={currentPageIndex === totalPages - 1 || disabled}
                            className="p-2 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7" />
                            </svg>
                        </button>
                    </div>

                    {/* Right: Add/Delete Page */}
                    <div className="flex items-center gap-2">
                        {totalPages > 1 && (
                            <button
                                type="button"
                                onClick={deletePage}
                                disabled={disabled}
                                className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 011.995 1.858L5 7m5 4v6m0-6L5 7m5 4v6" />
                                </svg>
                                Hapus
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={addPage}
                            disabled={disabled}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4m0 0l4 4m0 0116.138 21H7.862a2 2 0 011.995 1.858L5 7m5 4v6m0-6L5 7m5 4v6" />
                                Tambah Halaman
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Dots Indicator */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-3">
                        {pages.map((_, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => goToPage(index)}
                                disabled={disabled}
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

            {/* Media Upload Section */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        📷 Upload Media (Halaman {currentPageIndex + 1})
                    </span>
                    <button
                        type="button"
                        onClick={() => setShowMediaUploader(!showMediaUploader)}
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                        {showMediaUploader ? 'Sembunyikan' : 'Tampilkan'}
                    </button>
                </div>

                {showMediaUploader && (
                    <div className="space-y-4 border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                        <MediaUploader
                            userId={userId}
                            onUpload={handleMediaUpload}
                            disabled={disabled}
                        />
                        <YouTubeEmbed
                            onEmbed={(embedHtml) => insertMediaToCurrentPage(embedHtml)}
                            disabled={disabled}
                        />
                    </div>
                )}
            </div>

            {/* TipTap Editor */}
            <div className="relative">
                <RichTextEditor
                    key={`${cacheKey}-${currentPageIndex}`}
                    content={currentPage?.content || ''}
                    onChange={handleContentChange}
                    placeholder={`Tulis konten halaman ${currentPageIndex + 1} di sini...`}
                    disabled={disabled}
                />
            </div>

            {/* Page indicator bottom */}
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                💡 Konten disimpan otomatis. Anda bisa menambah halaman dan melanjutkan nanti.
            </div>
        </div>
    )
}

export { clearCachedPages }
