'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getCurrentUserProfile, getCurrentUserDetailProfile } from '@/lib/profile'
import type { Profile, UserProfile } from '@/types/database'

export default function UserNav() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      const data = await getCurrentUserProfile()
      setProfile(data)

      // Load user detail profile for avatar and name
      const detailData = await getCurrentUserDetailProfile()
      setUserProfile(detailData)

      setLoading(false)
    }

    loadProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          const data = await getCurrentUserProfile()
          setProfile(data)

          const detailData = await getCurrentUserDetailProfile()
          setUserProfile(detailData)
        } else if (event === 'SIGNED_OUT') {
          setProfile(null)
          setUserProfile(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="absolute top-4 right-4">
        <div className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-500 rounded-lg animate-pulse">
          Loading...
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="absolute top-4 right-4">
        <Link
          href="/login"
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
        >
          Login
        </Link>
      </div>
    )
  }

  return (
    <div className="absolute top-4 right-4 flex items-center gap-3">
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {userProfile?.nama || profile.username}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          @{profile.username}
        </p>
      </div>
      {userProfile?.avatar_url ? (
        <img
          src={userProfile.avatar_url}
          alt={profile.username}
          className="w-10 h-10 rounded-full object-cover border-2 border-indigo-600"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
          {profile.username.charAt(0).toUpperCase()}
        </div>
      )}
      
      {profile.role === 'superadmin' && (
        <Link
          href="/admin/dashboard"
          className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors font-semibold"
        >
          Admin Dashboard
        </Link>
      )}

      <Link
        href="/profile"
        className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
      >
        Edit Profile
      </Link>
      <button
        onClick={handleSignOut}
        className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors font-semibold"
      >
        Logout
      </button>
    </div>
  )
}
