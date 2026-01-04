'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from "next/link"
import MaterialList from "@/components/MaterialList"
import { supabase } from '@/lib/supabase'
import LoadingScreen from '@/components/LoadingScreen'

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
    return <LoadingScreen loading={true} />
  }

  if (!hasProfile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-indigo-600 hover:underline mb-4 inline-block font-semibold">
            ← Kembali ke Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Multi-Source Knowledge
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Kelola materi pembelajaran dari berbagai sumber dalam satu tempat
          </p>
        </div>

        {/* Material List Component */}
        <MaterialList />
      </div>
    </div>
  )
}
