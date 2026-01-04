'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getCurrentUserProfile } from '@/lib/profile'
import { deleteFile } from '@/lib/storage'
import type { Material, Topic } from '@/types/database'
import { stripHtml } from '@/lib/htmlUtils'
import AddMaterialModal from '@/components/AddMaterialModal'
import AddTopicModal from '@/components/AddTopicModal'
import MaterialDetailModal from '@/components/MaterialDetailModal'
import Navbar from '@/components/Navbar'

export default function MentorDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [activeTab, setActiveTab] = useState<'published' | 'draft'>('published')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [editingMaterial, setEditingMaterial] = useState<Material | undefined>(undefined)
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null)

  const checkAuthAndLoadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const profile = await getCurrentUserProfile()
      if (!profile || profile.role !== 'mentor') {
        router.push('/')
        return
      }

      setUserId(user.id)
      await Promise.all([
        loadMaterials(user.id),
        loadTopics()
      ])
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    checkAuthAndLoadData()
  }, [checkAuthAndLoadData])

  const loadMaterials = async (uid: string) => {
    try {
      // Fetch materials created by this user
      // Note: We are selecting * so we get the status field if it exists
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('created_by', uid)
        .order('created_at', { ascending: false })

      if (error) throw error

      setMaterials(data || [])
    } catch (error) {
      console.error('Error loading materials:', error)
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
    } catch (error) {
      console.error('Error loading topics:', error)
    }
  }

  const handleMaterialAdded = () => {
    setIsAddModalOpen(false)
    setEditingMaterial(undefined)
    if (userId) {
      loadMaterials(userId)
    }
  }

  const handleTopicAdded = () => {
    setIsTopicModalOpen(false)
    loadTopics()
  }

  const handleEditClick = (material: Material) => {
    setEditingMaterial(material)
    setIsAddModalOpen(true)
  }

  const handleCreateClick = () => {
    router.push('/mentor/material/create')
  }

  const handlePreviewClick = (material: Material) => {
    // Create slug from title and encode ID
    const slug = material.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    // Encode ID as base64
    const encodedId = btoa(material.id.toString())
    router.push(`/material/${slug}?ref=${encodedId}`)
  }

  const handleDeleteClick = async (material: Material) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus materi "${material.title}"? Semua file media yang terkait juga akan dihapus.`)) {
      return
    }

    setDeletingId(material.id)

    try {
      // Extract media URLs from content and delete from storage
      const mediaUrls = extractMediaUrls(material.content)
      for (const url of mediaUrls) {
        try {
          // Extract path from URL (e.g., userId/images/filename.jpg)
          const pathMatch = url.match(/materials\/([^?]+)/)
          if (pathMatch && pathMatch[1]) {
            await deleteFile(pathMatch[1])
          }
        } catch (err) {
          console.error('Error deleting file:', err)
          // Continue deleting other files even if one fails
        }
      }

      // Delete material from database
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', material.id)

      if (error) throw error

      // Reload materials
      if (userId) {
        await loadMaterials(userId)
      }
    } catch (error: any) {
      console.error('Error deleting material:', error)
      alert('Gagal menghapus materi: ' + error.message)
    } finally {
      setDeletingId(null)
    }
  }

  // Helper function to extract media URLs from HTML content
  const extractMediaUrls = (content: string): string[] => {
    const urls: string[] = []
    // Match src attributes in img, video, audio tags
    const srcRegex = /src=["']([^"']+supabase[^"']+)["']/g
    let match
    while ((match = srcRegex.exec(content)) !== null) {
      urls.push(match[1])
    }
    return urls
  }

  const getTopicTitle = (topicId: number) => {
    const topic = topics.find(t => t.id === topicId)
    return topic ? topic.title : 'Unknown Topic'
  }

  // Filter materials based on active tab
  const filteredMaterials = materials.filter(m => {
    const status = m.status || 'published'
    return status === activeTab
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-black">
      {/* Navbar */}
      <Navbar />

      <div className="relative flex-1 overflow-hidden">
        {/* Decorative curved lines */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute border-2 border-gray-600 rounded-full"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: `${(i + 1) * 150}px`,
                  height: `${(i + 1) * 100}px`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <Link href="/" className="text-yellow-400 hover:text-yellow-300 mb-4 inline-block font-bold text-sm uppercase tracking-wider">
                ← Kembali ke Home
              </Link>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
                MENTOR{' '}
                <span className="bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                  DASHBOARD
                </span>
              </h1>
              <p className="text-gray-400 text-lg">
                Kelola materi pembelajaran dan topik Anda
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setIsTopicModalOpen(true)}
                className="px-6 py-3 bg-gray-800 border-2 border-gray-700 text-white rounded-xl hover:bg-gray-700 hover:border-gray-600 transition-all font-bold flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah Topik
              </button>
              <button
                onClick={handleCreateClick}
                className="px-6 py-3 bg-yellow-400 text-black rounded-xl hover:bg-yellow-300 transition-all font-black flex items-center gap-2 shadow-lg hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Buat Materi Baru
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-8">
            <div className="flex gap-2 p-1 bg-gray-900 rounded-xl inline-flex border border-gray-800">
              <button
                onClick={() => setActiveTab('published')}
                className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'published'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
              >
                Published
                <span className="ml-2 bg-black/20 text-white py-0.5 px-2 rounded-full text-xs">
                  {materials.filter(m => (m.status || 'published') === 'published').length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('draft')}
                className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'draft'
                  ? 'bg-yellow-500 text-black shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
              >
                Drafts
                <span className="ml-2 bg-black/20 text-current py-0.5 px-2 rounded-full text-xs">
                  {materials.filter(m => m.status === 'draft').length}
                </span>
              </button>
            </div>
          </div>

          {/* Content List */}
          <div className="grid gap-4">
            {filteredMaterials.length > 0 ? (
              filteredMaterials.map((material) => (
                <div
                  key={material.id}
                  className="group bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-600 transition-all hover:-translate-y-1 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button
                      onClick={() => handlePreviewClick(material)}
                      className="p-2 bg-gray-800 text-white rounded-lg hover:bg-green-600 transition-colors"
                      title="Preview"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEditClick(material)}
                      className="p-2 bg-gray-800 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                      title="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteClick(material)}
                      disabled={deletingId === material.id}
                      className="p-2 bg-gray-800 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                      title="Hapus"
                    >
                      {deletingId === material.id ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>

                  <div className="flex items-start gap-6">
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg transform group-hover:rotate-3 transition-transform ${material.status === 'draft'
                      ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black'
                      : 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white'
                      }`}>
                      {material.material_type.substring(0, 3).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      {material.tags && material.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {material.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-0.5 bg-gray-800 text-yellow-400 text-xs font-bold rounded-full border border-gray-700">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 rounded-full bg-gray-800 text-gray-300 text-xs font-bold uppercase tracking-wide border border-gray-700">
                          {getTopicTitle(material.topic_id)}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          {new Date(material.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 truncate group-hover:text-yellow-400 transition-colors">
                        {material.title}
                      </h3>
                      {material.url && (
                        <a
                          href={material.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Buka Sumber
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-800 rounded-2xl bg-gray-900/50">
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Belum ada materi {activeTab === 'published' ? 'terpublish' : 'draft'}
                </h3>
                <p className="text-gray-500 max-w-sm mb-8">
                  {activeTab === 'published'
                    ? 'Mulai berbagi pengetahuan Anda dengan membuat materi pembelajaran baru.'
                    : 'Draft materi yang Anda buat akan muncul di sini sebelum dipublish.'}
                </p>
                {activeTab === 'published' && (
                  <button
                    onClick={handleCreateClick}
                    className="px-6 py-3 bg-yellow-400 text-black rounded-xl hover:bg-yellow-300 transition-all font-black"
                  >
                    Buat Materi Pertama
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Add Material Modal */}
        {isAddModalOpen && userId && (
          <AddMaterialModal
            userId={userId}
            material={editingMaterial}
            onClose={() => {
              setIsAddModalOpen(false)
              setEditingMaterial(undefined)
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

        {/* Preview Modal */}
        {isPreviewOpen && previewMaterial && (
          <MaterialDetailModal
            material={previewMaterial}
            onClose={() => {
              setIsPreviewOpen(false)
              setPreviewMaterial(null)
            }}
          />
        )}
      </div>
    </div>
  )
}
