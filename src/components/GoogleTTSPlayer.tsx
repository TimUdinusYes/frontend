'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface GoogleTTSPlayerProps {
  text: string
}

export default function GoogleTTSPlayer({ text }: GoogleTTSPlayerProps) {
  const [isLoadingTTS, setIsLoadingTTS] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_TTS_API_KEY

  const generateAudio = useCallback(async () => {
    if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
      setError('API Key belum diset. Tambahkan NEXT_PUBLIC_GOOGLE_TTS_API_KEY di .env.local')
      return
    }

    setIsLoadingTTS(true)
    setError(null)

    try {
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: { text },
            voice: {
              languageCode: 'id-ID',
              name: 'id-ID-Wavenet-B',
              ssmlGender: 'MALE'
            },
            audioConfig: {
              audioEncoding: 'MP3',
              speakingRate: playbackRate,
              pitch: 0,
              volumeGainDb: 0
            }
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to generate audio')
      }

      const data = await response.json()
      const audioContent = data.audioContent

      const binaryString = atob(audioContent)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const blob = new Blob([bytes], { type: 'audio/mp3' })
      const url = URL.createObjectURL(blob)

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }

      setAudioUrl(url)

      if (audioRef.current) {
        audioRef.current.src = url
        audioRef.current.playbackRate = playbackRate
      }

      setIsLoadingTTS(false)
    } catch (err) {
      console.error('Error generating audio:', err)
      setError(err instanceof Error ? err.message : 'Gagal membuat audio')
      setIsLoadingTTS(false)
    }
  }, [playbackRate, text])

  useEffect(() => {
    generateAudio()
  }, [generateAudio])

  useEffect(() => {
    const currentAudio = audioRef.current
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      if (currentAudio) {
        currentAudio.pause()
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }

    progressIntervalRef.current = setInterval(() => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime)
      }
    }, 100)
  }

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }

  const handlePlayPause = () => {
    if (!audioRef.current || !audioUrl) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      stopProgressTracking()
    } else {
      audioRef.current.play()
      setIsPlaying(true)
      startProgressTracking()
    }
  }

  const handleStop = () => {
    if (!audioRef.current) return
    audioRef.current.pause()
    audioRef.current.currentTime = 0
    setCurrentTime(0)
    setIsPlaying(false)
    stopProgressTracking()
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return
    const newTime = parseFloat(e.target.value)
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate)
    setCurrentTime(0)
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
      stopProgressTracking()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-700">
      <audio
        ref={audioRef}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration)
        }}
        onEnded={() => {
          setIsPlaying(false)
          stopProgressTracking()
          setCurrentTime(duration)
        }}
        onError={() => {
          setError('Gagal memutar audio')
          setIsPlaying(false)
        }}
      />

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
                Dengarkan Materi (Google TTS)
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
                  disabled={isLoadingTTS}
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

        {!isLoadingTTS && audioUrl && (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-gray-600 dark:text-gray-400 w-12 text-right">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration || 0}
                step="0.1"
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                style={{
                  background: `linear-gradient(to right, rgb(79, 70, 229) 0%, rgb(79, 70, 229) ${(currentTime / duration) * 100}%, rgb(209, 213, 219) ${(currentTime / duration) * 100}%, rgb(209, 213, 219) 100%)`
                }}
              />
              <span className="text-xs font-mono text-gray-600 dark:text-gray-400 w-12">
                {formatTime(duration)}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 justify-center">
          {isLoadingTTS ? (
            <div className="flex items-center gap-2 px-4 py-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Generating audio...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-1 px-4 py-2">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
              </div>
              <button
                onClick={generateAudio}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Coba lagi
              </button>
            </div>
          ) : audioUrl ? (
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
  )
}
