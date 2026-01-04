'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getCurrentUserProfile } from '@/lib/profile'
import MaterialForm from '@/components/MaterialForm'
import Navbar from '@/components/Navbar'

function CreateMaterialContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const topicIdParam = searchParams.get('topicId')
  const initialTopicId = topicIdParam ? parseInt(topicIdParam) : undefined

  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const checkAuth = useCallback(async () => {
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
    } catch (error) {
      console.error('Error checking auth:', error)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const handleSuccess = () => {
    // Redirect to dashboard after successful creation
    router.push('/mentor/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    )
  }

  if (!userId) return null

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

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <Link href="/mentor/dashboard" className="text-yellow-400 hover:text-yellow-300 mb-4 inline-block font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali ke Dashboard
            </Link>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
              Buat Materi <span className="text-yellow-400">Baru</span>
            </h1>
            <p className="text-gray-400 text-lg">
              Bagikan pengetahuan Anda dengan membuat materi pembelajaran berkualitas.
            </p>
          </div>

          {/* Form Component */}
          <MaterialForm 
            userId={userId} 
            initialTopicId={initialTopicId}
            onSuccess={handleSuccess}
            onCancel={() => router.back()}
          />
        </div>
      </div>
    </div>
  )
}

export default function CreateMaterialPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    }>
      <CreateMaterialContent />
    </Suspense>
  )
}
