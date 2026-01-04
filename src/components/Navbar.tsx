'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getCurrentUserProfile, getCurrentUserDetailProfile } from '@/lib/profile'
import type { Profile, UserProfile } from '@/types/database'

export default function Navbar() {
  const [user, setUser] = useState<Profile | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    async function loadUser() {
      const profile = await getCurrentUserProfile()
      setUser(profile)

      if (profile) {
        const detailProfile = await getCurrentUserDetailProfile()
        setUserProfile(detailProfile)
      }
    }

    loadUser()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement
      if (!target.closest('.dropdown-container')) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isDropdownOpen])

  // Track scroll position
  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const features = [
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
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'pt-4' : ''
    }`}>
      <div className={`max-w-7xl mx-auto transition-all duration-300 ${
        isScrolled
          ? 'px-4 sm:px-6 lg:px-8'
          : 'px-0'
      }`}>
        <div className={`flex justify-between items-center h-16 transition-all duration-300 ${
          isScrolled
            ? 'bg-gray-800 rounded-full shadow-lg px-8'
            : 'bg-transparent px-4 sm:px-6 lg:px-8'
        }`}>
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-black transition-colors text-white">
              FASTLERN
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className={`font-semibold transition-colors ${
              isScrolled
                ? 'text-gray-300 hover:text-white'
                : 'text-white hover:text-gray-200'
            }`}>
              Home
            </Link>

            {/* Features Dropdown */}
            <div className="relative dropdown-container">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-1 font-semibold transition-colors ${
                  isScrolled
                    ? 'text-gray-300 hover:text-white'
                    : 'text-white hover:text-gray-200'
                }`}
              >
                Features
                <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                  {features.map((feature) => (
                    <Link
                      key={feature.path}
                      href={feature.path}
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="font-semibold text-gray-900 dark:text-white">{feature.title}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{feature.description}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
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
                {userProfile?.avatar_url ? (
                  <img
                    src={userProfile.avatar_url}
                    alt={user.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-white">
                    {user.username}
                  </p>
                  <p className="text-xs text-gray-300">
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
                {user.role === 'mentor' && (
                  <Link
                    href="/mentor/dashboard"
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-semibold"
                  >
                    Dashboard
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
  )
}
