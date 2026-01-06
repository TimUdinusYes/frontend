'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Topic, Material, UserProfile } from '@/types/database'
import { stripHtml } from '@/lib/htmlUtils'

interface QuizScoreInfo {
  material_id: number
  total_correct: number
  total_answered: number
  total_pages: number
  is_complete: boolean
}

export default function MaterialList() {
  const router = useRouter()
  const [topics, setTopics] = useState<Topic[]>([])
  const [materials, setMaterials] = useState<{ [topicId: number]: Material[] }>({})
  const [authors, setAuthors] = useState<{ [userId: string]: UserProfile }>({})
  const [quizScores, setQuizScores] = useState<{ [materialId: number]: QuizScoreInfo }>({})
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)

  const fetchAuthors = useCallback(async (userIds: string[]) => {
    if (userIds.length === 0) return

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .in('user_id', userIds)

      if (error) throw error

      if (data) {
        setAuthors(prev => {
          const updated = { ...prev }
          data.forEach(author => {
            updated[author.user_id] = author
          })
          return updated
        })
      }
    } catch (error) {
      console.error('Error fetching authors:', error)
    }
  }, [])

  const loadMaterialsForTopic = useCallback(async (topicId: number) => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('topic_id', topicId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        setMaterials(prev => ({
          ...prev,
          [topicId]: data
        }))

        const authorIds = Array.from(new Set(data.map(m => m.created_by)))
        await fetchAuthors(authorIds)
      }
    } catch (error) {
      console.error('Error loading materials:', error)
    }
  }, [fetchAuthors])

  const handleMaterialClick = useCallback((material: Material) => {
    // Create slug from title and encode ID
    const slug = material.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    // Encode ID as base64
    const encodedId = btoa(material.id.toString())
    router.push(`/material/${slug}?ref=${encodedId}`)
  }, [router])

  const loadCurrentUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
      // Load quiz scores for this user
      loadQuizScores(user.id)
    }
  }, [])

  const loadQuizScores = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/quiz/user-scores/${userId}`)
      const data = await res.json()

      if (data.success && data.scores) {
        const scoresMap: { [materialId: number]: QuizScoreInfo } = {}
        data.scores.forEach((score: QuizScoreInfo) => {
          scoresMap[score.material_id] = score
        })
        setQuizScores(scoresMap)
      }
    } catch (error) {
      console.error('Error loading quiz scores:', error)
    }
  }, [])

  const loadTopics = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setTopics(data || [])

      // Load materials for each topic
      if (data) {
        for (const topic of data) {
          await loadMaterialsForTopic(topic.id)
        }
      }
    } catch (error) {
      console.error('Error loading topics:', error)
    } finally {
      setLoading(false)
    }
  }, [loadMaterialsForTopic])

  useEffect(() => {
    loadCurrentUser()
    loadTopics()
  }, [loadCurrentUser, loadTopics])

  const handleTopicClick = useCallback((topic: Topic) => {
    setSelectedTopic(topic)
  }, [])

  const closeModal = useCallback(() => {
    setSelectedTopic(null)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Daftar Topik & Materi
        </h2>
      </div>

      {/* Topics List */}
      {topics.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 00-2-2v-4m0 0l4 4m-4 4m0 0l4 4m0 0 0118 0z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">
            Belum ada topik pembelajaran.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => {
            const topicMaterials = materials[topic.id] || []
            const recentMaterials = topicMaterials.slice(0, 2) // Get 2 most recent materials

            return (
              <div
                key={topic.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all hover:shadow-xl"
              >
                {/* Topic Header - Clickable */}
                <div
                  onClick={() => handleTopicClick(topic)}
                  className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700"
                >
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {topic.title}
                  </h3>
                  {topic.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                      {topic.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-5a2 2 0 01-2-2v-5a2 2 0 00-2-2H5a2 2 0 00-2 2v5a2 2 0 002 2h2" />
                    </svg>
                    <span>{topicMaterials.length} materi</span>
                  </div>
                </div>

                {/* Recent Materials Preview - Always Visible */}
                <div className="p-6">
                  {recentMaterials.length > 0 ? (
                    <div className="space-y-3">
                      {recentMaterials.map((material) => (
                        <div
                          key={material.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMaterialClick(material)
                          }}
                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                        >
                          {/* Material Type Icon */}
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                              <span className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
                                {material.material_type.substring(0, 3).toUpperCase()}
                              </span>
                            </div>
                          </div>

                          {/* Material Title Only */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {material.title}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {material.material_type}
                            </p>
                          </div>

                          {/* Quiz Score Badge (if exists) */}
                          {quizScores[material.id] && (
                            <div className={`flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${quizScores[material.id].is_complete
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              }`}>
                              {quizScores[material.id].is_complete ? (
                                <>
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  <span>{quizScores[material.id].total_correct}/{quizScores[material.id].total_pages}</span>
                                </>
                              ) : (
                                <span>{quizScores[material.id].total_answered}/{quizScores[material.id].total_pages}</span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">
                      Belum ada materi
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Topic Detail Modal */}
      {selectedTopic && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-[95vw] max-w-[1600px] max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-2">{selectedTopic.title}</h2>
                  {selectedTopic.description && (
                    <p className="text-indigo-100">{selectedTopic.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-5a2 2 0 01-2-2v-5a2 2 0 00-2-2H5a2 2 0 00-2 2v5a2 2 0 002 2h2" />
                    </svg>
                    <span>{materials[selectedTopic.id]?.length || 0} materi tersedia</span>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="ml-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
              {materials[selectedTopic.id] && materials[selectedTopic.id].length > 0 ? (
                <div className="space-y-4">
                  {materials[selectedTopic.id].map((material) => (
                    <div
                      key={material.id}
                      onClick={() => handleMaterialClick(material)}
                      className="flex items-start p-5 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all cursor-pointer border-2 border-transparent hover:border-indigo-500"
                    >
                      {/* Material Type Icon */}
                      <div className="flex-shrink-0 mr-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                          <span className="text-indigo-600 dark:text-indigo-400 text-sm font-bold">
                            {material.material_type.substring(0, 3).toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Material Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {material.title}
                          </h4>
                          {/* Quiz Score Badge */}
                          {quizScores[material.id] && (
                            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${quizScores[material.id].is_complete
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              }`}>
                              {quizScores[material.id].is_complete ? (
                                <>
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  <span>{quizScores[material.id].total_correct}/{quizScores[material.id].total_pages}</span>
                                </>
                              ) : (
                                <span>{quizScores[material.id].total_answered}/{quizScores[material.id].total_pages}</span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                            <span>Oleh:</span>
                            <Link
                              href={currentUserId === material.created_by ? '/mentor/dashboard' : `/mentor/${material.created_by}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                            >
                              {authors[material.created_by]?.avatar_url && (
                                <img
                                  src={authors[material.created_by].avatar_url!}
                                  alt="avatar"
                                  className="w-5 h-5 rounded-full"
                                />
                              )}
                              {currentUserId === material.created_by ? 'Anda' : (authors[material.created_by]?.nama || 'Mentor')}
                            </Link>
                          </div>

                          <span className="text-gray-300 dark:text-gray-600">|</span>

                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {material.material_type}
                          </span>
                        </div>

                        {material.tags && material.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {material.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs rounded-full font-medium">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-5a2 2 0 01-2-2v-5a2 2 0 00-2-2H5a2 2 0 00-2 2v5a2 2 0 002 2h2" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400">
                    Belum ada materi untuk topik ini
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
