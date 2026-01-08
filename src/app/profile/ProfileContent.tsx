'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import UserProfileForm from '@/components/UserProfileForm'
import LevelDisplay from '@/app/games/components/LevelDisplay'
import BadgeCollection from '@/app/games/components/BadgeCollection'

const fadeInUp = {
  animation: 'fadeInUp 0.6s ease-out forwards',
}

const fadeIn = {
  animation: 'fadeIn 0.5s ease-out forwards',
}

export function ProfileContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const [userLevel, setUserLevel] = useState<number>(1)

  const checkAuth = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUserId(user.id)
    } catch (error) {
      console.error('Error checking auth:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    checkAuth()

    // Ambil message dari query parameter
    const message = searchParams.get('message')
    if (message) {
      setAlertMessage(decodeURIComponent(message))
    }
  }, [searchParams, checkAuth])

  // Fetch user level
  useEffect(() => {
    const fetchUserLevel = async () => {
      if (!userId) return

      try {
        const response = await fetch(`/api/user/stats?userId=${userId}`)
        const data = await response.json()
        if (data.success) {
          setUserLevel(data.stats.level)
        }
      } catch (error) {
        console.error('Error fetching user level:', error)
      }
    }

    fetchUserLevel()
  }, [userId])

  const handleSuccess = () => {
    // Redirect to home or show success message
    setTimeout(() => {
      router.push('/')
    }, 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-100 to-blue-200" style={fadeIn}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-black mx-auto"></div>
          <p className="mt-4 text-black font-black">Loading...</p>
        </div>
      </div>
    )
  }

  if (!userId) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 py-12" style={fadeInUp}>
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
      {alertMessage && (
        <div className="max-w-4xl mx-auto px-4 mb-6" style={fadeIn}>
          <div className="bg-yellow-400 border-2 border-black rounded-xl p-4 flex items-start gap-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex-1">
              <h3 className="text-sm font-black text-black mb-1">Perhatian</h3>
              <p className="text-sm text-black">{alertMessage}</p>
            </div>
            <button
              onClick={() => setAlertMessage(null)}
              className="text-black hover:text-gray-700 font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Level Display Section */}
      <div className="max-w-4xl mx-auto px-4 mb-6">
        <LevelDisplay userId={userId} />
      </div>

      {/* Badge Collection Section */}
      <div className="max-w-4xl mx-auto px-4 mb-6">
        <BadgeCollection currentLevel={userLevel} />
      </div>

      <UserProfileForm userId={userId} onSuccess={handleSuccess} />
    </div>
  )
}
