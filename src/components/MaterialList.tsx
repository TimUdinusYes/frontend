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
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-black"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-black">
          Daftar Topik & Materi
        </h2>
      </div>

      {/* Topics List */}
      {topics.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-gray-700 font-bold">
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
                className="bg-white rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden transition-all duration-500 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2"
              >
                {/* Topic Header - Clickable */}
                <div
                  onClick={() => handleTopicClick(topic)}
                  className="p-6 cursor-pointer hover:bg-blue-50 transition-colors"
                >
                  <h3 className="text-xl font-black text-black mb-3 truncate" title={topic.title}>
                    {topic.title.length > 25 ? topic.title.substring(0, 25) + '...' : topic.title}
                  </h3>
                  {topic.description && (
                    <p className="text-gray-600 text-sm mb-3">
                      {topic.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                    <span className="text-lg">📄</span>
                    <span>{topicMaterials.length} materi</span>
                  </div>
                </div>

                {/* Recent Materials Preview - Always Visible */}
                <div className="p-6 bg-gray-50">
                  {recentMaterials.length > 0 ? (
                    <div className="space-y-3">
                      {recentMaterials.map((material, index) => (
                        <div
                          key={material.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMaterialClick(material)
                          }}
                          className="flex items-center gap-3 p-4 bg-white rounded-xl border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-500 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 cursor-pointer"
                        >
                          {/* Material Type Icon */}
                          <div className="flex-shrink-0">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-3 border-black ${
                              index % 4 === 0 ? 'bg-pink-400' :
                              index % 4 === 1 ? 'bg-teal-400' :
                              index % 4 === 2 ? 'bg-yellow-400' : 'bg-green-400'
                            }`}>
                              <span className="text-sm font-bold text-black">
                                {material.material_type.substring(0, 3).toUpperCase()}
                              </span>
                            </div>
                          </div>

                          {/* Material Title Only */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-black text-black truncate">
                              {material.title}
                            </h4>
                            <p className="text-xs text-gray-600 mt-0.5 font-semibold">
                              {material.material_type}
                            </p>
                          </div>

                          {/* Quiz Score Badge (if exists) */}
                          {quizScores[material.id] && (
                            <div className={`flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border-2 border-black ${quizScores[material.id].is_complete
                                ? 'bg-green-400 text-black'
                                : 'bg-yellow-400 text-black'
                              }`}>
                              {quizScores[material.id].is_complete ? (
                                <>
                                  <span>✓</span>
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
                    <p className="text-center text-gray-600 py-4 text-sm font-semibold">
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
            className="bg-white rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-[90vw] max-w-[1200px] max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-400 to-blue-500 p-6 text-white border-b-2 border-black">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-3xl font-black text-black mb-2 break-words">{selectedTopic.title}</h2>
                  {selectedTopic.description && (
                    <p className="text-black font-semibold">{selectedTopic.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-2 text-sm font-bold text-black">
                    <span className="text-lg">📄</span>
                    <span>{materials[selectedTopic.id]?.length || 0} materi tersedia</span>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="ml-4 p-2 hover:bg-yellow-400 rounded-lg transition-colors border-2 border-black bg-white"
                >
                  <span className="text-2xl font-black text-black">✕</span>
                </button>
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
              {materials[selectedTopic.id] && materials[selectedTopic.id].length > 0 ? (
                <div className="space-y-4">
                  {materials[selectedTopic.id].map((material, index) => (
                    <div
                      key={material.id}
                      onClick={() => handleMaterialClick(material)}
                      className="flex items-start p-5 bg-white rounded-xl border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-500 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 cursor-pointer"
                    >
                      {/* Material Type Icon */}
                      <div className="flex-shrink-0 mr-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-3 border-black ${
                          index % 4 === 0 ? 'bg-pink-400' :
                          index % 4 === 1 ? 'bg-teal-400' :
                          index % 4 === 2 ? 'bg-yellow-400' : 'bg-green-400'
                        }`}>
                          <span className="text-sm font-bold text-black">
                            {material.material_type.substring(0, 3).toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Material Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-lg font-black text-black">
                            {material.title}
                          </h4>
                          {/* Quiz Score Badge */}
                          {quizScores[material.id] && (
                            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border-2 border-black ${quizScores[material.id].is_complete
                                ? 'bg-green-400 text-black'
                                : 'bg-yellow-400 text-black'
                              }`}>
                              {quizScores[material.id].is_complete ? (
                                <>
                                  <span>✓</span>
                                  <span>{quizScores[material.id].total_correct}/{quizScores[material.id].total_pages}</span>
                                </>
                              ) : (
                                <span>{quizScores[material.id].total_answered}/{quizScores[material.id].total_pages}</span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <div className="flex items-center gap-1 text-sm text-gray-700 font-semibold">
                            <span>Oleh:</span>
                            <Link
                              href={currentUserId === material.created_by ? '/mentor/dashboard' : `/mentor/${material.created_by}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-black text-blue-600 hover:underline flex items-center gap-1"
                            >
                              {authors[material.created_by]?.avatar_url && (
                                <img
                                  src={authors[material.created_by].avatar_url!}
                                  alt="avatar"
                                  className="w-5 h-5 rounded-full border border-black"
                                />
                              )}
                              {currentUserId === material.created_by ? 'Anda' : (authors[material.created_by]?.nama || 'Mentor')}
                            </Link>
                          </div>

                          <span className="text-gray-400">|</span>

                          <span className="text-sm text-gray-700 font-semibold">
                            {material.material_type}
                          </span>
                        </div>

                        {material.tags && material.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {material.tags.map((tag, tagIndex) => (
                              <span key={tagIndex} className={`px-2 py-1 text-black text-xs rounded-full font-bold border-2 border-black ${
                                tagIndex % 4 === 0 ? 'bg-pink-400' :
                                tagIndex % 4 === 1 ? 'bg-teal-400' :
                                tagIndex % 4 === 2 ? 'bg-yellow-400' : 'bg-green-400'
                              }`}>
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
                <div className="text-center py-12 bg-white rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-6xl mb-4">📚</div>
                  <p className="text-gray-700 font-bold">
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

