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
  }, [authors, setAuthors])

  const fetchAuthors = useCallback(async (userIds: string[]) => {
    if (userIds.length === 0) return

    // Filter out IDs we already have
    const newIds = userIds.filter(id => !authors[id])
    if (newIds.length === 0) return

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .in('user_id', newIds)

      if (error) throw error

      if (data) {
        const newAuthors = { ...authors }
        data.forEach(author => {
          newAuthors[author.user_id] = author
        })
        setAuthors(prev => ({ ...prev, ...newAuthors }))
      }
    } catch (error) {
      console.error('Error fetching authors:', error)
    }
  }, [authors, setAuthors])

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
        <div className="space-y-4">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
            >
              {/* Topic Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {topic.title}
                  </h3>
                  {topic.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {topic.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Materials List */}
              <div className="p-6">
                {materials[topic.id] && materials[topic.id].length > 0 ? (
                  <div className="space-y-3">
                    {materials[topic.id].map((material) => (
                      <div
                        key={material.id}
                        onClick={() => handleMaterialClick(material)}
                        className="flex items-start p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                      >
                        {/* Material Type Icon */}
                        <div className="flex-shrink-0 mr-4">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                            <span className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
                              {material.material_type.substring(0, 3).toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {/* Material Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400">
                              {material.title}
                            </h4>
                            {/* Quiz Score Badge */}
                            {quizScores[material.id] && (
                              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${quizScores[material.id].is_complete
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

                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
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
                                    className="w-4 h-4 rounded-full"
                                  />
                                )}
                                {currentUserId === material.created_by ? 'Anda' : (authors[material.created_by]?.nama || 'Mentor')}
                              </Link>
                            </div>

                            <span className="text-gray-300 dark:text-gray-600">|</span>

                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              {material.material_type}
                            </span>
                          </div>

                          {material.tags && material.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {material.tags.map((tag, index) => (
                                <span key={index} className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded-full">
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
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                    Belum ada materi untuk topik ini.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
