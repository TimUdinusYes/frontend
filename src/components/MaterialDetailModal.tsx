'use client'

import { useState, useEffect, useRef } from 'react'
import { Material } from '@/types/database'

interface MaterialDetailModalProps {
  material: Material
  onClose: () => void
}

export default function MaterialDetailModal({ material, onClose }: MaterialDetailModalProps) {
  const [isLoadingTTS, setIsLoadingTTS] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isTTSSupported, setIsTTSSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const isMountedRef = useRef(true)
  const startTimeRef = useRef<number>(0)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const estimateDuration = (text: string, rate: number) => {
    const wordsPerMinute = 150 * rate
    const words = text.split(/\s+/).length
    return (words / wordsPerMinute) * 60
  }

  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }

    startTimeRef.current = Date.now() - currentTime * 1000

    progressIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      setCurrentTime(Math.min(elapsed, duration))

      if (elapsed >= duration) {
        clearInterval(progressIntervalRef.current!)
        progressIntervalRef.current = null
      }
    }, 100)
  }

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setIsTTSSupported(true)

      const estimatedDuration = estimateDuration(material.content, playbackRate)
      setDuration(estimatedDuration)

      const utterance = new SpeechSynthesisUtterance(material.content)
      utterance.lang = 'id-ID'
      utterance.rate = playbackRate
      utterance.pitch = 1

      utterance.onstart = () => {
        setIsPlaying(true)
        setIsLoadingTTS(false)
        startProgressTracking()
      }

      utterance.onend = () => {
        setIsPlaying(false)
        stopProgressTracking()
        setCurrentTime(duration)
      }

      utterance.onerror = (event) => {
        if (!isMountedRef.current) return
        if (event.error === 'canceled' || event.error === 'interrupted') return
        setIsPlaying(false)
        setIsLoadingTTS(false)
        setError('Gagal memutar audio')
        stopProgressTracking()
        console.error('Speech synthesis error:', event)
      }

      utteranceRef.current = utterance

      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices()
        const indonesianVoice = voices.find(voice => voice.lang.startsWith('id'))
        if (indonesianVoice) {
          utterance.voice = indonesianVoice
        }
        setIsLoadingTTS(false)
      }

      if (window.speechSynthesis.getVoices().length > 0) {
        loadVoices()
      } else {
        window.speechSynthesis.onvoiceschanged = loadVoices
      }
    } else {
      setIsTTSSupported(false)
      setIsLoadingTTS(false)
      setError('Browser tidak mendukung text-to-speech')
    }

    return () => {
      isMountedRef.current = false
      stopProgressTracking()
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel()
      }
    }
  }, [material.content, playbackRate, duration])

  const handlePlayPause = () => {
    if (!utteranceRef.current) return

    if (isPlaying) {
      window.speechSynthesis.pause()
      setIsPlaying(false)
      stopProgressTracking()
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
        setIsPlaying(true)
        startProgressTracking()
      } else {
        window.speechSynthesis.cancel()
        setCurrentTime(0)

        const newUtterance = new SpeechSynthesisUtterance(material.content)
        newUtterance.lang = 'id-ID'
        newUtterance.rate = playbackRate
        newUtterance.pitch = 1

        const voices = window.speechSynthesis.getVoices()
        const indonesianVoice = voices.find(voice => voice.lang.startsWith('id'))
        if (indonesianVoice) {
          newUtterance.voice = indonesianVoice
        }

        newUtterance.onstart = () => {
          setIsPlaying(true)
          startProgressTracking()
        }

        newUtterance.onend = () => {
          setIsPlaying(false)
          stopProgressTracking()
          setCurrentTime(duration)
        }

        newUtterance.onerror = (event) => {
          if (!isMountedRef.current) return
          if (event.error === 'canceled' || event.error === 'interrupted') return
          setIsPlaying(false)
          stopProgressTracking()
          console.error('Speech error:', event)
          setError('Gagal memutar audio: ' + event.error)
        }

        utteranceRef.current = newUtterance
        window.speechSynthesis.speak(newUtterance)
      }
    }
  }

  const handleStop = () => {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
    stopProgressTracking()
    setCurrentTime(0)
  }

  const handleRateChange = (rate: number) => {
    const wasPlaying = isPlaying
    if (wasPlaying) {
      window.speechSynthesis.cancel()
      stopProgressTracking()
    }

    setPlaybackRate(rate)
    setCurrentTime(0)

    if (wasPlaying) {
      setTimeout(() => handlePlayPause(), 100)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-start">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                  {material.material_type.substring(0, 3).toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {material.material_type}
                </span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {material.title}
                </h2>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
              Isi Materi
            </h3>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {material.content}
              </p>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-700">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Dengarkan Materi
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {isLoadingTTS ? 'Mempersiapkan audio...' : isPlaying ? 'Sedang diputar' : 'Siap diputar'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-white dark:bg-gray-700 px-2 py-1 rounded-lg">
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => handleRateChange(rate)}
                          className={`px-2 py-1 text-xs rounded transition-colors ${
                            playbackRate === rate
                              ? 'bg-indigo-600 text-white font-semibold'
                              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-gray-600 dark:text-gray-400 w-12 text-right">
                      {formatTime(currentTime)}
                    </span>
                    <div className="flex-1 h-2 bg-gray-300 dark:bg-gray-600 rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 transition-all duration-100"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-gray-600 dark:text-gray-400 w-12">
                      {formatTime(duration)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 justify-center">
                  {isLoadingTTS ? (
                    <div className="flex items-center gap-2 px-4 py-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
                    </div>
                  ) : error ? (
                    <div className="flex flex-col items-start gap-1 px-4 py-2">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
                      </div>
                      <button
                        onClick={() => {
                          setError(null)
                          setIsLoadingTTS(false)
                        }}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Coba lagi
                      </button>
                    </div>
                  ) : isTTSSupported ? (
                    <>
                      <button
                        onClick={handlePlayPause}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold flex items-center gap-2 shadow-md"
                      >
                        {isPlaying ? (
                          <>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Pause
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                            Play
                          </>
                        )}
                      </button>
                      {(isPlaying || currentTime > 0) && (
                        <button
                          onClick={handleStop}
                          className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-semibold flex items-center gap-2 shadow-md"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                          </svg>
                          Reset
                        </button>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {material.url && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                Sumber
              </h3>
              <a
                href={material.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline break-all"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                {material.url}
              </a>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Tanggal dibuat</span>
                <p className="text-gray-900 dark:text-white font-medium">
                  {new Date(material.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Terakhir diupdate</span>
                <p className="text-gray-900 dark:text-white font-medium">
                  {new Date(material.updated_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-600">
          {material.url && (
            <a
              href={material.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
            >
              Buka Sumber
            </a>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
