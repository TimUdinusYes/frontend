'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from "next/link"
import MaterialList from "@/components/MaterialList"
import { supabase } from '@/lib/supabase'

export default function MultiSourceKnowledgePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [hasProfile, setHasProfile] = useState(false)

  const checkUserProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('id, nama')
        .eq('user_id', user.id)
        .single()

      if (error || !profile || !profile.nama) {
        router.push('/select-role')
        return
      }

      setHasProfile(true)
    } catch (error) {
      console.error('Error checking profile:', error)
      router.push('/select-role')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    checkUserProfile()
  }, [checkUserProfile])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-100 to-blue-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-black mx-auto mb-4"></div>
          <p className="text-gray-700 font-bold">Loading...</p>
        </div>
      </div>
    )
  }

  if (!hasProfile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200">
      {/* Decorative clouds */}
      <div className="absolute top-10 left-5 w-16 h-8 bg-white rounded-full opacity-70 blur-sm"></div>
      <div className="absolute top-16 left-16 w-10 h-5 bg-white rounded-full opacity-60 blur-sm"></div>
      <div className="absolute top-12 right-10 w-20 h-10 bg-white rounded-full opacity-70 blur-sm"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Header Section */}
        <div className="mb-12">
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-800 hover:text-black font-bold mb-6 transition-all duration-300 hover:scale-105"
          >
            <span className="text-2xl">←</span>
            <span>Kembali ke Home</span>
          </Link>

          {/* Title */}
          <h1 className="text-5xl md:text-6xl font-black text-black mb-4">
            Multi-Source Knowledge
          </h1>
          
          {/* Description */}
          <p className="text-gray-700 text-lg max-w-2xl leading-relaxed">
            Connect the dots! See how math links to music and science links to stories in a giant, interactive web of fun facts.
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Card 1 */}
          <div className="relative bg-white rounded-2xl p-6 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-pink-400 rounded-full flex items-center justify-center border-2 border-black mb-4">
                <span className="text-2xl">📚</span>
              </div>
              <h3 className="text-lg font-black text-black mb-2">
                Multiple Sources
              </h3>
              <p className="text-sm text-gray-600">
                Access materials from various sources all in one place
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="relative bg-white rounded-2xl p-6 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-teal-400 rounded-full flex items-center justify-center border-2 border-black mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-lg font-black text-black mb-2">
                Smart Search
              </h3>
              <p className="text-sm text-gray-600">
                Find exactly what you need with powerful search
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="relative bg-white rounded-2xl p-6 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-black mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-lg font-black text-black mb-2">
                Organized Learning
              </h3>
              <p className="text-sm text-gray-600">
                Keep your study materials perfectly organized
              </p>
            </div>
          </div>
        </div>

        {/* Material List Component */}
        <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-black">
              <span className="text-xl">📋</span>
            </div>
            <h2 className="text-2xl font-black text-black">
              Learning Materials
            </h2>
          </div>
          <MaterialList />
        </div>
      </div>

      {/* Decorative dots pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-full h-full" style={{
          backgroundImage: 'radial-gradient(circle, #64748B 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }}></div>
      </div>
    </div>
  )
}
