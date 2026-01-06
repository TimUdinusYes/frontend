'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from "next/link"
import { getCurrentUserProfile } from '@/lib/profile'
import Navbar from '@/components/Navbar'
import type { Profile } from '@/types/database'

export default function Home() {
  const router = useRouter()
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
        setShowLoading(false)
      }
    }

    checkUser()
  }, [router])

  if (showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="flex-1">
        {/* Hero Section - Light Blue Background */}
        <div className="relative bg-gradient-to-b from-blue-100 to-blue-200 min-h-screen overflow-hidden flex flex-col">
          {/* Decorative clouds */}
          <div className="absolute top-20 left-10 w-32 h-16 bg-white rounded-full opacity-70 blur-sm"></div>
          <div className="absolute top-32 left-32 w-20 h-10 bg-white rounded-full opacity-60 blur-sm"></div>
          <div className="absolute top-24 right-20 w-40 h-20 bg-white rounded-full opacity-70 blur-sm"></div>
          <div className="absolute top-40 right-48 w-24 h-12 bg-white rounded-full opacity-60 blur-sm"></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 flex-1 flex flex-col justify-center">
            <div className="text-center mb-auto pt-10">
              {/* Main Title - SINAUIN */}
              <h1 className="text-8xl md:text-9xl font-black text-black mb-8 leading-tight tracking-tighter">
                SINAUIN
              </h1>
            </div>
          </div>

          {/* Character and Mountain Illustration - Positioned to overlap with checkerboard */}
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex justify-center">
            <img
              src="/landingpage1.png"
              alt="SINAUIN Character"
              className="w-auto h-80 md:h-[32rem] lg:h-[40rem] object-contain"
            />
          </div>

          {/* Checkered Pattern at Bottom - 4 rows */}
          <div className="absolute bottom-0 left-0 right-0 h-48 overflow-hidden z-0">
            {/* Row 1 */}
            <div className="flex h-12">
              {[...Array(100)].map((_, i) => (
                <div
                  key={`row1-${i}`}
                  className={`flex-shrink-0 w-12 h-12 ${
                    i % 2 === 0 ? 'bg-black' : 'bg-white'
                  }`}
                />
              ))}
            </div>
            {/* Row 2 */}
            <div className="flex h-12">
              {[...Array(100)].map((_, i) => (
                <div
                  key={`row2-${i}`}
                  className={`flex-shrink-0 w-12 h-12 ${
                    i % 2 === 0 ? 'bg-white' : 'bg-black'
                  }`}
                />
              ))}
            </div>
            {/* Row 3 */}
            <div className="flex h-12">
              {[...Array(100)].map((_, i) => (
                <div
                  key={`row3-${i}`}
                  className={`flex-shrink-0 w-12 h-12 ${
                    i % 2 === 0 ? 'bg-black' : 'bg-white'
                  }`}
                />
              ))}
            </div>
            {/* Row 4 */}
            <div className="flex h-12">
              {[...Array(100)].map((_, i) => (
                <div
                  key={`row4-${i}`}
                  className={`flex-shrink-0 w-12 h-12 ${
                    i % 2 === 0 ? 'bg-white' : 'bg-black'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Services Section */}
        <div className="relative bg-white py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-black mb-4">
                FITUR UNGGULAN
              </h2>
              <p className="text-gray-600 text-lg">
                Platform pembelajaran terlengkap untuk kebutuhan belajar Anda
              </p>
            </div>

            {/* Services Grid - Simplified */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1 - Adaptive Material */}
              <Link href="/AdaptiveMaterial" className="group">
                <div className="bg-gradient-to-br from-pink-400 to-pink-500 rounded-3xl p-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📚</div>
                    <h3 className="text-xl font-black text-white mb-2">
                      Adaptive Material
                    </h3>
                    <p className="text-sm text-white">
                      Materi yang menyesuaikan dengan Anda
                    </p>
                  </div>
                </div>
              </Link>

              {/* Card 2 - Educational Games */}
              <Link href="/EducationalGames" className="group">
                <div className="bg-gradient-to-br from-purple-400 to-purple-500 rounded-3xl p-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🎮</div>
                    <h3 className="text-xl font-black text-white mb-2">
                      Educational Games
                    </h3>
                    <p className="text-sm text-white">
                      Belajar sambil bermain
                    </p>
                  </div>
                </div>
              </Link>

              {/* Card 3 - PeerConnect */}
              <Link href="/PeerConnect" className="group">
                <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-3xl p-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1">
                  <div className="text-center">
                    <div className="text-4xl mb-4">👥</div>
                    <h3 className="text-xl font-black text-white mb-2">
                      Peer Connect
                    </h3>
                    <p className="text-sm text-white">
                      Belajar bersama teman
                    </p>
                  </div>
                </div>
              </Link>

              {/* Card 4 - Multi-Source Knowledge */}
              <Link href="/Multi-Source-Knowledge" className="group">
                <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-3xl p-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🌐</div>
                    <h3 className="text-xl font-black text-black mb-2">
                      Multi-Source
                    </h3>
                    <p className="text-sm text-black">
                      Berbagai sumber pengetahuan
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-pink-400 to-purple-500 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
              Mulai Petualangan Belajar Anda!
            </h2>
            <p className="text-xl text-white mb-8 max-w-2xl mx-auto">
              Bergabunglah dengan SINAUIN dan rasakan cara belajar yang lebih menyenangkan
            </p>
            {!user && (
              <Link
                href="/login"
                className="inline-block px-8 py-4 bg-white text-black text-lg font-black rounded-full hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl border-4 border-black"
              >
                Daftar Sekarang
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
