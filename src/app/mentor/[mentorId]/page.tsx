'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Material, Profile, UserProfile } from '@/types/database'
import Navbar from '@/components/Navbar'
import { stripHtml } from '@/lib/htmlUtils'
import LoadingScreen from '@/components/LoadingScreen'
import MaterialDetailModal from '@/components/MaterialDetailModal'

export default function MentorProfilePage() {
  const params = useParams()
  const router = useRouter()
  const mentorId = params.mentorId as string

  const [loading, setLoading] = useState(true)
  const [mentorProfile, setMentorProfile] = useState<Profile | null>(null)
  const [mentorDetail, setMentorDetail] = useState<UserProfile | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [isMaterialDetailOpen, setIsMaterialDetailOpen] = useState(false)

  const loadMentorData = useCallback(async () => {
    try {
      // 1. Load Mentor Profile (auth info)
      const { data: profile, error: profileError } = await supabase
        .from('user')
        .select('*')
        .eq('id', mentorId)
        .single()

      if (profileError) throw profileError
      setMentorProfile(profile)

      if (profile.role !== 'mentor') {
        // Handle case where ID exists but is not a mentor
        console.warn('User is not a mentor')
        // You might want to redirect or show an error
      }

      // 2. Load Mentor Details (name, avatar, etc.)
      const { data: detail, error: detailError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', mentorId)
        .single()

      if (!detailError) {
        setMentorDetail(detail)
      }

      // 3. Load Mentor's Published Materials
      const { data: materialsData, error: materialsError } = await supabase
        .from('materials')
        .select('*')
        .eq('created_by', mentorId)
        .eq('status', 'published') // Only show published materials
        .order('created_at', { ascending: false })

      if (materialsError) throw materialsError
      setMaterials(materialsData || [])

    } catch (error) {
      console.error('Error loading mentor data:', error)
    } finally {
      setLoading(false)
    }
  }, [mentorId])

  useEffect(() => {
    if (mentorId) {
      loadMentorData()
    }
  }, [mentorId, loadMentorData])

  const handleMaterialClick = (material: Material) => {
    setSelectedMaterial(material)
    setIsMaterialDetailOpen(true)
  }

  if (loading) {
    return <LoadingScreen loading={true} />
  }

  if (!mentorProfile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Mentor Tidak Ditemukan</h2>
            <Link href="/" className="text-indigo-600 hover:underline">Kembali ke Beranda</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* Mentor Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-32 md:h-48"></div>
          <div className="px-8 pb-8">
            <div className="relative flex items-end -mt-16 mb-4">
              <div className="relative">
                {mentorDetail?.avatar_url ? (
                  <img
                    src={mentorDetail.avatar_url}
                    alt={mentorDetail.nama || mentorProfile.username}
                    className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 object-cover bg-white"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 bg-indigo-600 flex items-center justify-center text-4xl font-bold text-white">
                    {(mentorDetail?.nama || mentorProfile.username).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="ml-6 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {mentorDetail?.nama || mentorProfile.username}
                </h1>
                <p className="text-indigo-600 dark:text-indigo-400 font-medium">
                  @{mentorProfile.username}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="text-center">
                <span className="block text-2xl font-bold text-gray-900 dark:text-white">
                  {materials.length}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Materi Dipublikasikan</span>
              </div>
              <div className="text-center">
                <span className="block text-2xl font-bold text-gray-900 dark:text-white">
                  {/* Placeholder for joined date or other stat */}
                  {new Date(mentorProfile.created_at).getFullYear()}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Bergabung Sejak</span>
              </div>
              {/* Add more stats if available */}
            </div>

            {mentorDetail?.interest && Array.isArray(mentorDetail.interest) && mentorDetail.interest.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Minat & Keahlian</h3>
                <div className="flex flex-wrap gap-2">
                  {mentorDetail.interest.map((tag, i) => (
                    <span key={i} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Materials List */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Materi Pembelajaran</h2>

        {materials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.map((material) => (
              <div
                key={material.id}
                onClick={() => handleMaterialClick(material)}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden flex flex-col h-full border border-gray-200 dark:border-gray-700"
              >
                <div className="p-6 flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${material.material_type === 'video' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                      material.material_type === 'article' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                      {material.material_type}
                    </span>
                    {material.tags && material.tags.length > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {material.tags.slice(0, 2).map(t => `#${t}`).join(' ')}
                        {material.tags.length > 2 && '...'}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {material.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-4">
                    {stripHtml(material.content, 150)}
                  </p>
                </div>

                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    {new Date(material.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                    Lihat Detail →
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-dashed border-gray-300 dark:border-gray-700">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Mentor ini belum mempublikasikan materi apapun.
            </p>
          </div>
        )}
      </div>

      {/* Material Detail Modal */}
      {isMaterialDetailOpen && selectedMaterial && (
        <MaterialDetailModal
          material={selectedMaterial}
          onClose={() => setIsMaterialDetailOpen(false)}
        />
      )}
    </div>
  )
}
