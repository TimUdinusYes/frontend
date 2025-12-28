'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Topic, Material } from '@/types/database'
import AddMaterialModal from './AddMaterialModal'
import AddTopicModal from './AddTopicModal'
import MaterialDetailModal from './MaterialDetailModal'

export default function MaterialList() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [materials, setMaterials] = useState<{ [topicId: number]: Material[] }>({})
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false)
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false)
  const [isMaterialDetailOpen, setIsMaterialDetailOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    loadUserAndTopics()
  }, [])

  const loadUserAndTopics = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }

      // Load topics
      await loadTopics()
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTopics = async () => {
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
    }
  }

  const loadMaterialsForTopic = async (topicId: number) => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('topic_id', topicId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setMaterials(prev => ({
        ...prev,
        [topicId]: data || []
      }))
    } catch (error) {
      console.error('Error loading materials:', error)
    }
  }

  const handleAddMaterial = (topic: Topic) => {
    setSelectedTopic(topic)
    setIsMaterialModalOpen(true)
  }

  const handleMaterialAdded = () => {
    if (selectedTopic) {
      loadMaterialsForTopic(selectedTopic.id)
    }
    setIsMaterialModalOpen(false)
    setSelectedTopic(null)
  }

  const handleAddTopic = () => {
    setIsTopicModalOpen(true)
  }

  const handleTopicAdded = () => {
    loadTopics()
    setIsTopicModalOpen(false)
  }

  const handleMaterialClick = (material: Material) => {
    setSelectedMaterial(material)
    setIsMaterialDetailOpen(true)
  }

  const handleCloseMaterialDetail = () => {
    setIsMaterialDetailOpen(false)
    setSelectedMaterial(null)
  }

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
        <button
          onClick={handleAddTopic}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Topik
        </button>
      </div>

      {/* Topics List */}
      {topics.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Belum ada topik pembelajaran.
          </p>
          <button
            onClick={handleAddTopic}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
          >
            Buat Topik Pertama
          </button>
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
                <div className="flex justify-between items-start">
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
                  <button
                    onClick={() => handleAddMaterial(topic)}
                    className="ml-4 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-semibold whitespace-nowrap"
                  >
                    + Add Materi
                  </button>
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
                          <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                            {material.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {material.content}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              {material.material_type}
                            </span>
                            {material.url && (
                              <span className="text-xs text-indigo-600 dark:text-indigo-400">
                                Lihat Sumber
                              </span>
                            )}
                          </div>
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

      {/* Add Material Modal */}
      {isMaterialModalOpen && selectedTopic && userId && (
        <AddMaterialModal
          topic={selectedTopic}
          userId={userId}
          onClose={() => {
            setIsMaterialModalOpen(false)
            setSelectedTopic(null)
          }}
          onSuccess={handleMaterialAdded}
        />
      )}

      {/* Add Topic Modal */}
      {isTopicModalOpen && userId && (
        <AddTopicModal
          userId={userId}
          onClose={() => setIsTopicModalOpen(false)}
          onSuccess={handleTopicAdded}
        />
      )}

      {/* Material Detail Modal */}
      {isMaterialDetailOpen && selectedMaterial && (
        <MaterialDetailModal
          material={selectedMaterial}
          onClose={handleCloseMaterialDetail}
        />
      )}
    </div>
  )
}
