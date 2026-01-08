"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  activityTracker,
  type ActivityStats,
} from "../services/activityTracker";
import { aiAnalysis, type LearningAnalysis } from "../services/aiAnalysis";

export default function TaskIntegratorUnified() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [analysis, setAnalysis] = useState<LearningAnalysis | null>(null);
  const [lastAnalyzedTime, setLastAnalyzedTime] = useState<Date | null>(null);
  const isAnalyzing = useRef(false);
  const hasAutoAnalyzed = useRef(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const activityStats = await activityTracker.getCombinedStats();
    setStats(activityStats);
    setLoading(false);

    // Auto-load AI analysis jika ada data (only once on mount)
    if (
      activityStats &&
      activityStats.totalMaterialsOpened > 0 &&
      !hasAutoAnalyzed.current
    ) {
      hasAutoAnalyzed.current = true;
      loadAIAnalysis(activityStats);
    }
  }, []);

  const refreshData = useCallback(async () => {
    // Refresh stats tanpa loading overlay
    const activityStats = await activityTracker.getCombinedStats();
    const currentStats = stats;

    // Cek apakah ada perubahan signifikan
    if (currentStats && activityStats) {
      const hasNewData =
        activityStats.totalMaterialsOpened !==
          currentStats.totalMaterialsOpened ||
        activityStats.materialsCompleted !== currentStats.materialsCompleted ||
        activityStats.totalTimeSpent !== currentStats.totalTimeSpent;

      if (hasNewData) {
        setStats(activityStats);
        // Re-analyze dengan data baru only if not already analyzing
        if (!isAnalyzing.current) {
          loadAIAnalysis(activityStats);
        }
      }
    }
  }, []);

  useEffect(() => {
    loadData();

    // Auto-refresh setiap 5 menit untuk detect aktivitas baru
    const interval = setInterval(() => {
      refreshData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [loadData, refreshData]);

  const handleManualRefresh = async () => {
    await loadData();
  };

  const loadAIAnalysis = async (activityStats?: ActivityStats) => {
    const dataToAnalyze = activityStats || stats;
    if (!dataToAnalyze) return;

    // Prevent multiple simultaneous calls
    if (isAnalyzing.current) {
      console.log("⏸️ Analysis already in progress, skipping...");
      return;
    }

    isAnalyzing.current = true;
    setAiLoading(true);
    try {
      const learningAnalysis = await aiAnalysis.analyzeLearningPattern(
        dataToAnalyze
      );
      setAnalysis(learningAnalysis);
      setLastAnalyzedTime(new Date());
    } catch (error) {
      console.error("Failed to load AI analysis:", error);
    } finally {
      setAiLoading(false);
      isAnalyzing.current = false;
    }
  };

  const completionRate =
    stats && stats.totalMaterialsOpened > 0
      ? Math.round(
          (stats.materialsCompleted / stats.totalMaterialsOpened) * 100
        )
      : 0;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "hard":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getSpeedBadge = (speed: string) => {
    const colors = {
      slow: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      medium:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      fast: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    };
    return colors[speed as keyof typeof colors] || colors.medium;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-blue-100">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-blue-100">

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 px-4 py-2 bg-white text-black font-black border-2 border-black rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Kembali
        </button>

        {/* Header with Stats */}
        <div className="bg-pink-300 rounded-xl border-[3px] border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] p-8 mb-8 text-black">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-xl border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <svg
                  className="w-8 h-8 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-black">AI Learning Analytics</h1>
                <p className="text-black/80 mt-1 font-semibold">
                  Peta pengetahuan & analisis pembelajaran dengan AI
                </p>
                {lastAnalyzedTime && (
                  <p className="text-black/70 text-xs mt-1 font-medium">
                    Terakhir dianalisis:{" "}
                    {lastAnalyzedTime.toLocaleTimeString("id-ID")}
                  </p>
                )}
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleManualRefresh}
              disabled={loading || aiLoading}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black font-black border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-50 disabled:shadow-none"
              title="Refresh & Analisis Ulang"
            >
              <svg
                className={`w-5 h-5 ${
                  loading || aiLoading ? "animate-spin" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>

          {stats && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-200 rounded-xl p-4 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-2xl font-black text-black">
                    {stats.totalMaterialsOpened}
                  </div>
                  <div className="text-black/70 text-sm font-bold">Materi Dibuka</div>
                </div>
                <div className="bg-yellow-200 rounded-xl p-4 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-2xl font-black text-black">{stats.totalTimeSpent}</div>
                  <div className="text-black/70 text-sm font-bold">Menit Belajar</div>
                </div>
                <div className="bg-green-200 rounded-xl p-4 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-2xl font-black text-black">
                    {stats.materialsCompleted}
                  </div>
                  <div className="text-black/70 text-sm font-bold">Selesai</div>
                </div>
                <div className="bg-pink-200 rounded-xl p-4 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-2xl font-black text-black">{completionRate}%</div>
                  <div className="text-black/70 text-sm font-bold">Completion</div>
                </div>
              </div>

              {/* Learning Velocity inside header */}
              {analysis?.learningVelocity && (
                <div className="bg-white rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 border-2 border-black rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-black"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-black text-black">
                        Kecepatan Belajar
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getSpeedBadge(
                          analysis.learningVelocity.overallSpeed
                        )}`}
                      >
                        {analysis.learningVelocity.overallSpeed}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {analysis.learningVelocity.fastTopics.length > 0 && (
                      <div>
                        <p className="text-sm font-bold text-black mb-2">
                          ⚡ Cepat
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.learningVelocity.fastTopics.map(
                            (topic, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-green-200 border-2 border-black text-black text-xs rounded-full font-bold"
                              >
                                {topic}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}
                    {analysis.learningVelocity.slowTopics.length > 0 && (
                      <div>
                        <p className="text-sm font-bold text-black mb-2">
                          🐢 Perlu Lebih Banyak Waktu
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.learningVelocity.slowTopics.map(
                            (topic, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-orange-200 border-2 border-black text-black text-xs rounded-full font-bold"
                              >
                                {topic}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}
                    <div className="pt-3 border-t-2 border-black">
                      <p className="text-sm text-black font-bold">
                        💡 {analysis.learningVelocity.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {aiLoading && (
            <div className="mt-6 flex items-center gap-3 bg-white rounded-xl p-4 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              <span className="text-black font-bold">AI sedang menganalisis pola belajar Anda...</span>
            </div>
          )}
        </div>

        {!stats || stats.totalMaterialsOpened === 0 ? (
          <div className="bg-yellow-200 rounded-xl border-[3px] border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
            <div className="w-20 h-20 bg-white rounded-full border-2 border-black flex items-center justify-center mx-auto mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <svg
                className="w-10 h-10 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-xl font-black text-black mb-2">
              Belum Ada Data Aktivitas
            </h3>
            <p className="text-black/70 mb-6 font-semibold">
              Mulai belajar dengan membuka materi untuk melihat analisis AI Anda
            </p>
          </div>
        ) : (
          <>
            {/* Motivational Message */}
            {analysis?.motivationalMessage && (
              <div className="bg-green-300 rounded-xl border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-8 text-black">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl border-2 border-black flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <svg
                      className="w-6 h-6 text-black"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-lg mb-2">
                      Pesan untuk Anda
                    </h3>
                    <p className="text-black/80 font-semibold">
                      {analysis.motivationalMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Knowledge Map */}
            {analysis?.knowledgeMap && (
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {/* Mastered Concepts */}
                <div className="bg-green-200 rounded-xl border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-white rounded-xl border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <svg
                        className="w-5 h-5 text-black"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-black text-black">
                        Sudah Paham
                      </h3>
                      <p className="text-xs text-black/70 font-bold">
                        {analysis.knowledgeMap.masteredConcepts.length} konsep
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3 overflow-y-auto max-h-96 pr-2">
                    {analysis.knowledgeMap.masteredConcepts.map(
                      (concept, idx) => (
                        <div
                          key={idx}
                          className="bg-white border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-black text-sm">
                              {concept.concept}
                            </h4>
                            <span className="text-xs font-black text-black">
                              {concept.confidence}%
                            </span>
                          </div>
                          <p className="text-xs text-black/70 font-medium">
                            {concept.evidence}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Learning Concepts */}
                <div className="bg-yellow-200 rounded-xl border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-white rounded-xl border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <svg
                        className="w-5 h-5 text-black"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-black text-black">
                        Sedang Belajar
                      </h3>
                      <p className="text-xs text-black/70 font-bold">
                        {analysis.knowledgeMap.learningConcepts.length} konsep
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3 overflow-y-auto max-h-96 pr-2">
                    {analysis.knowledgeMap.learningConcepts.map(
                      (concept, idx) => (
                        <div
                          key={idx}
                          className="bg-white border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-black text-sm">
                              {concept.concept}
                            </h4>
                            {concept.needsReview && (
                              <span className="text-xs bg-orange-200 text-black border border-black px-2 py-1 rounded-full font-bold">
                                Perlu Review
                              </span>
                            )}
                          </div>
                          <div className="mb-2">
                            <div className="h-2 bg-white border border-black rounded-full overflow-hidden">
                              <div
                                className="h-full bg-yellow-400"
                                style={{ width: `${concept.progress}%` }}
                              />
                            </div>
                            <p className="text-xs text-black/70 mt-1 font-medium">
                              {concept.progress}% progress
                            </p>
                          </div>
                          <p className="text-xs text-black/70 mb-1 font-medium">
                            ⏱️ {concept.estimatedTimeToMaster}
                          </p>
                          {concept.status && (
                            <p className="text-xs text-black bg-yellow-100 border border-black px-2 py-1 rounded font-bold">
                              📌 {concept.status}
                            </p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Not Started */}
                <div className="bg-purple-200 rounded-xl border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-white rounded-xl border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <svg
                        className="w-5 h-5 text-black"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-black text-black">
                        Belum Dimulai
                      </h3>
                      <p className="text-xs text-black/70 font-bold">
                        {analysis.knowledgeMap.notStartedConcepts.length} konsep
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3 overflow-y-auto max-h-96 pr-2">
                    {analysis.knowledgeMap.notStartedConcepts.map(
                      (concept, idx) => (
                        <div
                          key={idx}
                          className="bg-white border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-black text-sm">
                              {concept.concept}
                            </h4>
                            <span className="text-xs px-2 py-1 rounded-full border border-black bg-orange-200 text-black font-bold">
                              {concept.difficulty}
                            </span>
                          </div>
                          {concept.reason && (
                            <p className="text-xs text-black/70 mb-2 italic font-medium">
                              💡 {concept.reason}
                            </p>
                          )}
                          {concept.prerequisite.length > 0 && (
                            <p className="text-xs text-black/70 mb-1 font-medium">
                              📚 Butuh: {concept.prerequisite.join(", ")}
                            </p>
                          )}
                          <p className="text-xs text-black/70 font-medium">
                            ⏱️ {concept.estimatedLearningTime}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Predicted Challenges */}
            {analysis?.predictedChallenges &&
              analysis.predictedChallenges.length > 0 && (
                <div className="bg-orange-200 rounded-xl border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-white border-2 border-black rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-black"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-black text-black">
                        Prediksi Tantangan
                      </h3>
                      <p className="text-xs text-black font-bold">
                        Antisipasi kesulitan
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {analysis.predictedChallenges.map((challenge, idx) => (
                      <div
                        key={idx}
                        className="bg-white border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-3"
                      >
                        <h4 className="font-bold text-black text-sm mb-1">
                          {challenge.topic}
                        </h4>
                        <p className="text-xs text-black mb-2">
                          {challenge.challenge}
                        </p>
                        <div className="bg-yellow-200 border-2 border-black rounded-lg p-2">
                          <p className="text-xs text-black font-bold">
                            💡 <strong>Tips:</strong>{" "}
                            {challenge.preventionTip}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}


            {/* Optimal Learning Path */}
            {analysis?.optimalLearningPath &&
              analysis.optimalLearningPath.length > 0 && (
                <div className="bg-purple-200 rounded-xl border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-white border-2 border-black rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-black"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-black text-black">
                        Jalur Belajar Optimal
                      </h3>
                      <p className="text-xs text-black font-bold">
                        Rekomendasi urutan belajar
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {analysis.optimalLearningPath.map((step, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            {step.step}
                          </div>
                        </div>
                        <div className="flex-1 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-4">
                          <h4 className="font-bold text-black mb-1">
                            {step.topic}
                          </h4>
                          <p className="text-sm text-black mb-2">
                            {step.reason}
                          </p>
                          <span className="text-xs text-black font-bold">
                            ⏱️ Estimasi: {step.estimatedTime}
                          </span>
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
                  <div className="bg-cyan-200 rounded-xl border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-white border-2 border-black rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-black"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                      </div>
                      <h3 className="font-black text-black">
                        Pola Belajar Anda
                      </h3>
                    </div>
                    <p className="text-black font-bold">
                      {analysis.studyPattern}
                    </p>
                  </div>
                )}

                {/* Quick Insights */}
                {analysis.insights && analysis.insights.length > 0 && (
                  <div className="bg-pink-200 rounded-xl border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-white border-2 border-black rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-black"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </div>
                      <h3 className="font-black text-black">
                        Quick Insights
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {analysis.insights.slice(0, 3).map((insight, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-sm"
                        >
                          <span className="text-black font-black mt-1">•</span>
                          <p className="text-black font-bold">
                            {insight.description}
                          </p>
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
  );
}