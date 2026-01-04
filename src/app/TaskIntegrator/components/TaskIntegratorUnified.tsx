'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { activityTracker, type ActivityStats } from '../services/activityTracker'
import { aiAnalysis, type LearningAnalysis } from '../services/aiAnalysis'
import './scrollbar.css'

export default function TaskIntegratorUnified() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [stats, setStats] = useState<ActivityStats | null>(null)
  const [analysis, setAnalysis] = useState<LearningAnalysis | null>(null)
  const [lastAnalyzedTime, setLastAnalyzedTime] = useState<Date | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const activityStats = await activityTracker.getActivityStats()
    setStats(activityStats)
    setLoading(false)

    // Auto-load AI analysis jika ada data
    if (activityStats && activityStats.totalMaterialsOpened > 0) {
      loadAIAnalysis(activityStats)
    }
  }, [])

  const refreshData = useCallback(async () => {
    // Refresh stats tanpa loading overlay
    const activityStats = await activityTracker.getActivityStats()

    // Cek apakah ada perubahan signifikan
    if (stats && activityStats) {
      const hasNewData =
        activityStats.totalMaterialsOpened !== stats.totalMaterialsOpened ||
        activityStats.materialsCompleted !== stats.materialsCompleted ||
        activityStats.totalTimeSpent !== stats.totalTimeSpent

      if (hasNewData) {
        setStats(activityStats)
        // Re-analyze dengan data baru
        loadAIAnalysis(activityStats)
      }
    }
  }, [stats])

  useEffect(() => {
    loadData()

    // Auto-refresh setiap 5 menit untuk detect aktivitas baru
    const interval = setInterval(() => {
      refreshData()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [loadData, refreshData])

  const handleManualRefresh = async () => {
    await loadData()
  }

  const loadAIAnalysis = async (activityStats?: ActivityStats) => {
    const dataToAnalyze = activityStats || stats
    if (!dataToAnalyze) return

    setAiLoading(true)
    const learningAnalysis = await aiAnalysis.analyzeLearningPattern(dataToAnalyze)
    setAnalysis(learningAnalysis)
    setLastAnalyzedTime(new Date())
    setAiLoading(false)
  }

  const completionRate = stats && stats.totalMaterialsOpened > 0
    ? Math.round((stats.materialsCompleted / stats.totalMaterialsOpened) * 100)
    : 0

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const getSpeedBadge = (speed: string) => {
    const colors = {
      slow: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      fast: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    }
    return colors[speed as keyof typeof colors] || colors.medium
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Header with Stats */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold">AI Learning Analytics</h1>
                <p className="text-indigo-100 mt-1">
                  Peta pengetahuan & analisis pembelajaran dengan AI
                </p>
                {lastAnalyzedTime && (
                  <p className="text-indigo-200 text-xs mt-1">
                    Terakhir dianalisis: {lastAnalyzedTime.toLocaleTimeString('id-ID')}
                  </p>
                )}
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleManualRefresh}
              disabled={loading || aiLoading}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors disabled:opacity-50"
              title="Refresh & Analisis Ulang"
            >
              <svg
                className={`w-5 h-5 ${loading || aiLoading ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold">{stats.totalMaterialsOpened}</div>
                <div className="text-indigo-100 text-sm">Materi Dibuka</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold">{stats.totalTimeSpent}</div>
                <div className="text-indigo-100 text-sm">Menit Belajar</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold">{stats.materialsCompleted}</div>
                <div className="text-indigo-100 text-sm">Selesai</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold">{completionRate}%</div>
                <div className="text-indigo-100 text-sm">Completion</div>
              </div>
            </div>
          )}

          {aiLoading && (
            <div className="mt-6 flex items-center gap-3 bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>AI sedang menganalisis pola belajar Anda...</span>
            </div>
          )}
        </div>

        {!stats || stats.totalMaterialsOpened === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Belum Ada Data Aktivitas
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Mulai belajar dengan membuka materi untuk melihat analisis AI Anda
            </p>
          </div>
        ) : (
          <>
            {/* Motivational Message */}
            {analysis?.motivationalMessage && (
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 mb-8 text-white">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">Pesan untuk Anda</h3>
                    <p className="text-green-50">{analysis.motivationalMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Knowledge Map */}
            {analysis?.knowledgeMap && (
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {/* Mastered Concepts */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Sudah Paham</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{analysis.knowledgeMap.masteredConcepts.length} konsep</p>
                    </div>
                  </div>
                  <div className="space-y-3 overflow-y-auto max-h-96 pr-2 scrollbar-thin scrollbar-thumb-green-300 dark:scrollbar-thumb-green-700 scrollbar-track-transparent">
                    {analysis.knowledgeMap.masteredConcepts.map((concept, idx) => (
                      <div key={idx} className="border border-green-200 dark:border-green-800 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">{concept.concept}</h4>
                          <span className="text-xs font-bold text-green-600 dark:text-green-400">{concept.confidence}%</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{concept.evidence}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Learning Concepts */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/50 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Sedang Belajar</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{analysis.knowledgeMap.learningConcepts.length} konsep</p>
                    </div>
                  </div>
                  <div className="space-y-3 overflow-y-auto max-h-96 pr-2 scrollbar-thin scrollbar-thumb-yellow-300 dark:scrollbar-thumb-yellow-700 scrollbar-track-transparent">
                    {analysis.knowledgeMap.learningConcepts.map((concept, idx) => (
                      <div key={idx} className="border border-yellow-200 dark:border-yellow-800 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">{concept.concept}</h4>
                          {concept.needsReview && (
                            <span className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 px-2 py-1 rounded-full">
                              Perlu Review
                            </span>
                          )}
                        </div>
                        <div className="mb-2">
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-500"
                              style={{ width: `${concept.progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{concept.progress}% progress</p>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">⏱️ {concept.estimatedTimeToMaster}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Not Started */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Belum Dimulai</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{analysis.knowledgeMap.notStartedConcepts.length} konsep</p>
                    </div>
                  </div>
                  <div className="space-y-3 overflow-y-auto max-h-96 pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                    {analysis.knowledgeMap.notStartedConcepts.map((concept, idx) => (
                      <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">{concept.concept}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(concept.difficulty)}`}>
                            {concept.difficulty}
                          </span>
                        </div>
                        {concept.prerequisite.length > 0 && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            📚 Butuh: {concept.prerequisite.join(', ')}
                          </p>
                        )}
                        <p className="text-xs text-gray-600 dark:text-gray-400">⏱️ {concept.estimatedLearningTime}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Learning Velocity & Predicted Challenges */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Learning Velocity */}
              {analysis?.learningVelocity && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Kecepatan Belajar</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getSpeedBadge(analysis.learningVelocity.overallSpeed)}`}>
                        {analysis.learningVelocity.overallSpeed}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {analysis.learningVelocity.fastTopics.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">⚡ Cepat</p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.learningVelocity.fastTopics.map((topic, idx) => (
                            <span key={idx} className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs rounded-full">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {analysis.learningVelocity.slowTopics.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">🐢 Perlu Lebih Banyak Waktu</p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.learningVelocity.slowTopics.map((topic, idx) => (
                            <span key={idx} className="px-3 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 text-xs rounded-full">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        💡 {analysis.learningVelocity.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Predicted Challenges */}
              {analysis?.predictedChallenges && analysis.predictedChallenges.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/50 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Prediksi Tantangan</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Antisipasi kesulitan</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {analysis.predictedChallenges.map((challenge, idx) => (
                      <div key={idx} className="border border-orange-200 dark:border-orange-800 rounded-xl p-3">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">{challenge.topic}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{challenge.challenge}</p>
                        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2">
                          <p className="text-xs text-orange-700 dark:text-orange-300">
                            💡 <strong>Tips:</strong> {challenge.preventionTip}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Optimal Learning Path */}
            {analysis?.optimalLearningPath && analysis.optimalLearningPath.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Jalur Belajar Optimal</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Rekomendasi urutan belajar</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {analysis.optimalLearningPath.map((step, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                          {step.step}
                        </div>
                      </div>
                      <div className="flex-1 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{step.topic}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{step.reason}</p>
                        <span className="text-xs text-purple-600 dark:text-purple-400">⏱️ Estimasi: {step.estimatedTime}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Study Pattern & Insights */}
            {analysis && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Study Pattern */}
                {analysis.studyPattern && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Pola Belajar Anda</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">{analysis.studyPattern}</p>
                  </div>
                )}

                {/* Quick Insights */}
                {analysis.insights && analysis.insights.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/50 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Quick Insights</h3>
                    </div>
                    <div className="space-y-2">
                      {analysis.insights.slice(0, 3).map((insight, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-pink-500 mt-1">•</span>
                          <p className="text-gray-600 dark:text-gray-400">{insight.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
