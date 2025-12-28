'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from "next/link"
import { supabase } from '@/lib/supabase'
import { getCurrentUserProfile } from '@/lib/profile'
import LoadingScreen from '@/components/LoadingScreen'
import type { Profile } from '@/types/database'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [showLoading, setShowLoading] = useState(true)
  const [user, setUser] = useState<Profile | null>(null)

  useEffect(() => {
    async function checkUser() {
      try {
        const profile = await getCurrentUserProfile()
        setUser(profile)

        if (profile) {
          if (profile.role === 'user') {
            router.push('/select-role')
            return
          }
          if (profile.role === 'pending_mentor') {
            router.push('/mentor-pending')
            return
          }
        }
      } catch (error) {
        console.error('Error checking user:', error)
      } finally {
        // Trigger fade out animation before hiding
        setTimeout(() => {
          setLoading(false)
          setTimeout(() => setShowLoading(false), 300) // Wait for fade out to complete
        }, 1000) // Show loading for at least 1 second
      }
    }

    checkUser()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const features = [
    {
      path: "/AdaptiveMaterial",
      title: "Adaptive Material",
      description: "Adaptive Material Learning System"
    },
    {
      path: "/games",
      title: "Games",
      description: "Educational Games Platform"
    },
    {
      path: "/Multi-Source-Knowledge",
      title: "Multi-Source Knowledge",
      description: "Multi-Source Knowledge Base"
    },
    {
      path: "/n8n-workflow",
      title: "N8N Workflow",
      description: "Workflow Automation System"
    },
    {
      path: "/PeerConnect",
      title: "Peer Connect",
      description: "Peer-to-Peer Connection Platform"
    },
    {
      path: "/TaskIntegrator",
      title: "Task Integrator",
      description: "Task Integration & Management"
    }
  ];

  if (showLoading) {
    return <LoadingScreen loading={loading} />
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                FASTLERN
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition-colors">
                Home
              </Link>
              <Link href="/AdaptiveMaterial" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition-colors">
                Adaptive Material
              </Link>
              <Link href="/games" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition-colors">
                Games
              </Link>
              <Link href="/Multi-Source-Knowledge" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition-colors">
                Knowledge Base
              </Link>
            </div>

            {/* User Navigation */}
            <div className="flex items-center gap-3">
              {!user ? (
                <Link
                  href="/login"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                >
                  Login
                </Link>
              ) : (
                <>
                  {/* User Avatar */}
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {user.username}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user.role}
                    </p>
                  </div>
                  {user.role === 'superadmin' && (
                    <Link
                      href="/admin/dashboard"
                      className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                    >
                      Admin
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors font-semibold"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 pt-24">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">Welcome to FASTLERN</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
          {features.map((feature) => (
            <Link
              key={feature.path}
              href={feature.path}
              className="p-6 border rounded-lg hover:shadow-lg transition-shadow bg-white dark:bg-gray-800"
            >
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{feature.title}</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
