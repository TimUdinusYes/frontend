'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUserProfile } from '@/lib/profile'
import Navbar from '@/components/Navbar'
import type { Profile } from '@/types/database'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { useRef } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function HomePage() {
  const router = useRouter()
  const [showLoading, setShowLoading] = useState(true)
  const [user, setUser] = useState<Profile | null>(null)
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set())
  const [skateVisible, setSkateVisible] = useState(false)
  const [characterVisible, setCharacterVisible] = useState(false)

  // Framer Motion scroll animations
  const { scrollY } = useScroll()
  const characterY = useTransform(scrollY, [0, 500], [0, 200])
  const logoY = useTransform(scrollY, [0, 500], [0, 100])
  const cloudY = useTransform(scrollY, [0, 500], [0, -150])

  // Animation styles
  const getCardAnimation = (delay: number, isVisible: boolean) => ({
    animation: `fadeInUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s forwards`,
    opacity: 1,
    transform: 'translateY(0) rotateX(0deg)',
  })

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cardId = parseInt(entry.target.id.replace('feature-card-', ''))
            setVisibleCards((prev) => new Set([...prev, cardId]))
          }
        })
      },
      { threshold: 0.1 }
    )

    // Use setTimeout to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      // Observe all feature cards
      document.querySelectorAll('[id^="feature-card-"]').forEach((card) => {
        observer.observe(card)
      })

      // Observe skate character
      const skateElement = document.getElementById('skate-character')
      if (skateElement) {
        const skateObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                setSkateVisible(true)
              }
            })
          },
          { threshold: 0.2 }
        )
        skateObserver.observe(skateElement)
      }
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    async function checkUser() {
      try {
        const profile = await getCurrentUserProfile()
        setUser(profile)

        if (!profile) {
          // User belum login, redirect ke login
          router.push('/login')
          return
        }

        if (profile.role === 'user') {
          router.push('/select-role')
          return
        }
        if (profile.role === 'pending_mentor') {
          router.push('/mentor-pending')
          return
        }
      } catch (error) {
        console.error('Error checking user:', error)
        router.push('/login')
      } finally {
        setShowLoading(false)
      }
    }

    checkUser()
  }, [router])

  if (showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoadingSpinner text="Loading..." size="medium" />
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
        <div className="relative bg-gradient-to-b from-blue-100 to-blue-200 min-h-[55vh] sm:min-h-[65vh] md:min-h-screen overflow-hidden flex flex-col">
          {/* Decorative clouds - Responsive sizing with animation */}
          <motion.div
            className="absolute top-10 md:top-20 left-5 md:left-10 w-16 md:w-32 h-8 md:h-16 bg-white rounded-full opacity-70 blur-sm"
            style={{ y: cloudY }}
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 0.7 }}
            transition={{ duration: 1, delay: 0.2 }}
          />
          <motion.div
            className="absolute top-16 md:top-32 left-16 md:left-32 w-10 md:w-20 h-5 md:h-10 bg-white rounded-full opacity-60 blur-sm"
            style={{ y: cloudY }}
            initial={{ x: -80, opacity: 0 }}
            animate={{ x: 0, opacity: 0.6 }}
            transition={{ duration: 1.2, delay: 0.3 }}
          />
          <motion.div
            className="absolute top-12 md:top-24 right-10 md:right-20 w-20 md:w-40 h-10 md:h-20 bg-white rounded-full opacity-70 blur-sm"
            style={{ y: cloudY }}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 0.7 }}
            transition={{ duration: 1, delay: 0.4 }}
          />
          <motion.div
            className="absolute top-20 md:top-40 right-24 md:right-48 w-12 md:w-24 h-6 md:h-12 bg-white rounded-full opacity-60 blur-sm"
            style={{ y: cloudY }}
            initial={{ x: 120, opacity: 0 }}
            animate={{ x: 0, opacity: 0.6 }}
            transition={{ duration: 1.2, delay: 0.5 }}
          />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 md:pt-20 flex-1 flex flex-col justify-center">
            <div className="text-center mb-auto pt-5 md:pt-10">
              {/* Main Title is now an image */}
            </div>
          </div>

          {/* Character and Logo - Stacked Vertically */}
          <div className="absolute bottom-[6rem] sm:bottom-[4rem] md:bottom-[2rem] lg:bottom-[1rem] left-1/2 -translate-x-1/2 flex flex-col items-center w-full gap-0">
            {/* Logo on top */}
            <motion.img
              src="/SINAUIN.png"
              alt="SINAUIN Logo"
              className="w-auto h-[5rem] sm:h-[10rem] md:h-[12rem] lg:h-[14rem] xl:h-[18rem] object-contain mb-[-1rem] sm:mb-[-2rem] md:mb-[-2.5rem] lg:mb-[-3rem]"
              style={{ y: logoY }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
            {/* Character below - smaller size */}
            <motion.img
              src="/landingpage1.png"
              alt="SINAUIN Character"
              className="w-auto h-[12rem] sm:h-[22rem] md:h-[26rem] lg:h-[30rem] xl:h-[38rem] object-contain"
              style={{
                y: characterY,
              }}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>

          {/* Checkered Pattern at Bottom - Responsive sizing */}
          <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-28 md:h-36 overflow-hidden z-0">
            {/* Row 1 */}
            <div className="flex h-7 sm:h-9 md:h-12">
              {[...Array(100)].map((_, i) => (
                <div
                  key={`row1-${i}`}
                  className={`flex-shrink-0 w-7 sm:w-9 md:w-12 h-7 sm:h-9 md:h-12 ${i % 2 === 0 ? 'bg-black' : 'bg-white'
                    }`}
                />
              ))}
            </div>
            {/* Row 2 */}
            <div className="flex h-7 sm:h-9 md:h-12">
              {[...Array(100)].map((_, i) => (
                <div
                  key={`row2-${i}`}
                  className={`flex-shrink-0 w-7 sm:w-9 md:w-12 h-7 sm:h-9 md:h-12 ${i % 2 === 0 ? 'bg-white' : 'bg-black'
                    }`}
                />
              ))}
            </div>
            {/* Row 3 */}
            <div className="flex h-7 sm:h-9 md:h-12">
              {[...Array(100)].map((_, i) => (
                <div
                  key={`row3-${i}`}
                  className={`flex-shrink-0 w-7 sm:w-9 md:w-12 h-7 sm:h-9 md:h-12 ${i % 2 === 0 ? 'bg-black' : 'bg-white'
                    }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Services Section */}
        <div className="relative bg-white py-20">
          <style jsx>{`
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(30px) rotateX(0deg);
              }
              to {
                opacity: 1;
                transform: translateY(0) rotateX(0deg);
              }
            }
            @keyframes spring-bounce {
              0%, 100% {
                transform: scale(1) translateY(0);
              }
              50% {
                transform: scale(1.05) translateY(-8px);
              }
            }
            @keyframes float {
              0%, 100% {
                transform: translateY(0px);
              }
              50% {
                transform: translateY(-8px);
              }
            }
            .animate-float {
              animation: float 3s ease-in-out infinite;
            }
            .animate-float:hover {
              animation: none;
            }
          `}</style>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Epic Features Section */}
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <motion.h2
                className="text-4xl md:text-5xl font-black text-black mb-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Epic Features for Smart Learners
              </motion.h2>
              <motion.p
                className="text-gray-600 text-lg"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: false }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                Discover the magic tools that make Sinauin the best place to grow your brain!
              </motion.p>
            </motion.div>

            {/* Features Grid - Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-10 mb-20 max-w-6xl mx-auto">
              {/* Feature 1 - AI Task Integrator */}
              <motion.div
                className="relative group md:col-span-2"
                style={{ marginLeft: '12px', marginBottom: '16px' }}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                {/* Multiple stacked layers effect - always visible, move more on hover */}
                <div className="absolute inset-0 bg-blue-500 border-[3px] border-black z-0 translate-x-3 translate-y-3 group-hover:translate-x-4 group-hover:translate-y-4 transition-all duration-300" style={{ transitionDelay: '0ms' }}></div>
                <div className="absolute inset-0 bg-blue-400 border-[3px] border-black z-[1] translate-x-1.5 translate-y-1.5 group-hover:translate-x-2 group-hover:translate-y-2 transition-all duration-300" style={{ transitionDelay: '50ms' }}></div>

                <div
                  id="feature-card-0"
                  className="relative bg-blue-300 border-[3px] border-black p-8 transition-all duration-300 group-hover:-translate-x-1 group-hover:-translate-y-1 z-10 overflow-visible h-full"
                  style={{ transitionDelay: '100ms' }}
                  onMouseEnter={() => setHoveredCard(0)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div className="font-black tracking-wide mb-4 text-lg text-black">
                    AI TASK INTEGRATOR
                  </div>
                  <p className="text-sm leading-relaxed text-black/80 font-sans">
                    Let our friendly AI plan your day! It organizes homework, study time, and play into a fun schedule so you never miss a beat.
                  </p>
                </div>
              </motion.div>

              {/* Feature 2 - AI Adaptive Material */}
              <motion.div
                className="relative group md:col-span-2"
                style={{ marginLeft: '12px', marginBottom: '16px' }}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="absolute inset-0 bg-pink-500 border-[3px] border-black z-0 translate-x-3 translate-y-3 group-hover:translate-x-4 group-hover:translate-y-4 transition-all duration-300" style={{ transitionDelay: '0ms' }}></div>
                <div className="absolute inset-0 bg-pink-400 border-[3px] border-black z-[1] translate-x-1.5 translate-y-1.5 group-hover:translate-x-2 group-hover:translate-y-2 transition-all duration-300" style={{ transitionDelay: '50ms' }}></div>

                <div
                  id="feature-card-1"
                  className="relative bg-pink-300 border-[3px] border-black p-8 transition-all duration-300 group-hover:-translate-x-1 group-hover:-translate-y-1 z-10 overflow-visible h-full"
                  style={{ transitionDelay: '100ms' }}
                  onMouseEnter={() => setHoveredCard(1)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div className="font-black tracking-wide mb-4 text-lg text-black">
                    AI ADAPTIVE MATERIAL
                  </div>
                  <p className="text-sm leading-relaxed text-black/80 font-sans">
                    Lessons that magically change just for you! If it&apos;s too hard, we make it simpler; if it&apos;s too easy, get ready for a challenge.
                  </p>
                </div>
              </motion.div>

              {/* Feature 3 - Multi-Source Knowledge */}
              <motion.div
                className="relative group md:col-span-2"
                style={{ marginLeft: '12px', marginBottom: '16px' }}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div className="absolute inset-0 bg-orange-500 border-[3px] border-black z-0 translate-x-3 translate-y-3 group-hover:translate-x-4 group-hover:translate-y-4 transition-all duration-300" style={{ transitionDelay: '0ms' }}></div>
                <div className="absolute inset-0 bg-orange-400 border-[3px] border-black z-[1] translate-x-1.5 translate-y-1.5 group-hover:translate-x-2 group-hover:translate-y-2 transition-all duration-300" style={{ transitionDelay: '50ms' }}></div>

                <div
                  id="feature-card-2"
                  className="relative bg-orange-300 border-[3px] border-black p-8 transition-all duration-300 group-hover:-translate-x-1 group-hover:-translate-y-1 z-10 overflow-visible h-full"
                  style={{ transitionDelay: '100ms' }}
                  onMouseEnter={() => setHoveredCard(2)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div className="font-black tracking-wide mb-4 text-lg text-black">
                    MULTI-SOURCE KNOWLEDGE
                  </div>
                  <p className="text-sm leading-relaxed text-black/80 font-sans">
                    Connect the dots! See how math links to music and science links to stories in a giant, interactive web of fun facts.
                  </p>
                </div>
              </motion.div>

              {/* Feature 4 - Peer Connect */}
              <motion.div
                className="relative group md:col-span-3"
                style={{ marginLeft: '12px', marginBottom: '16px' }}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="absolute inset-0 bg-purple-500 border-[3px] border-black z-0 translate-x-3 translate-y-3 group-hover:translate-x-4 group-hover:translate-y-4 transition-all duration-300" style={{ transitionDelay: '0ms' }}></div>
                <div className="absolute inset-0 bg-purple-400 border-[3px] border-black z-[1] translate-x-1.5 translate-y-1.5 group-hover:translate-x-2 group-hover:translate-y-2 transition-all duration-300" style={{ transitionDelay: '50ms' }}></div>

                <div
                  id="feature-card-3"
                  className="relative bg-purple-300 border-[3px] border-black p-8 transition-all duration-300 group-hover:-translate-x-1 group-hover:-translate-y-1 z-10 overflow-visible"
                  style={{ transitionDelay: '100ms' }}
                  onMouseEnter={() => setHoveredCard(3)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div className="font-black tracking-wide mb-4 text-lg text-black">
                    PEER CONNECT & GROUPS
                  </div>
                  <p className="text-sm leading-relaxed text-black/80 font-sans">
                    Join clubs, video call friends to study together, and make new buddies who love what you love in a safe space!
                  </p>
                </div>
              </motion.div>

              {/* Feature 5 - Games & Gamification */}
              <motion.div
                className="relative group md:col-span-3"
                style={{ marginLeft: '12px', marginBottom: '16px' }}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <div className="absolute inset-0 bg-green-500 border-[3px] border-black z-0 translate-x-3 translate-y-3 group-hover:translate-x-4 group-hover:translate-y-4 transition-all duration-300" style={{ transitionDelay: '0ms' }}></div>
                <div className="absolute inset-0 bg-green-400 border-[3px] border-black z-[1] translate-x-1.5 translate-y-1.5 group-hover:translate-x-2 group-hover:translate-y-2 transition-all duration-300" style={{ transitionDelay: '50ms' }}></div>

                <div
                  id="feature-card-4"
                  className="relative bg-green-300 border-[3px] border-black p-8 transition-all duration-300 group-hover:-translate-x-1 group-hover:-translate-y-1 z-10 overflow-visible"
                  style={{ transitionDelay: '100ms' }}
                  onMouseEnter={() => setHoveredCard(4)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div className="font-black tracking-wide mb-4 text-lg text-black">
                    GAMES & GAMIFICATION
                  </div>
                  <p className="text-sm leading-relaxed text-black/80 font-sans">
                    Level up while learning! Earn points, unlock achievements, and compete in fun challenges that make studying feel like playing!
                  </p>
                </div>
              </motion.div>
            </div>

          </div>
        </div>

        {/* Skateboard Character Divider */}
        <div className="relative w-full" style={{ height: '400px' }}>
          {/* Smooth gradient transition from white to blue */}
          <div className="absolute inset-0 bg-gradient-to-b from-white via-blue-50 to-blue-100"></div>

          {/* Character Image - 3x bigger in left corner */}
          <motion.div
            className="absolute left-0 z-10"
            style={{ bottom: '-80px' }}
            initial={{ x: -200, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <img
              src="/skate.png"
              alt="SINAUIN Skateboard Character"
              className="h-[600px] w-auto object-contain"
            />
          </motion.div>
        </div>

        {/* How It Works Section */}
        <div className="relative bg-gradient-to-b from-blue-100 to-blue-200 py-20 overflow-hidden">
          {/* Decorative Dots Pattern */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-full h-full" style={{
              backgroundImage: 'radial-gradient(circle, #64748B 1px, transparent 1px)',
              backgroundSize: '30px 30px'
            }}></div>
          </div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Section Header */}
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-black text-black mb-4">
                How It Works
              </h2>
              <p className="text-gray-700 text-lg">
                Start your learning adventure in 3 easy steps!
              </p>
            </motion.div>

            {/* Steps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              {/* Dashed Line Connector - Hidden on mobile */}
              <div className="hidden md:block absolute top-[42px] left-0 right-0 z-0">
                <div className="mx-auto" style={{ maxWidth: '900px', paddingLeft: '80px', paddingRight: '80px' }}>
                  <svg width="100%" height="2" preserveAspectRatio="none" className="w-full">
                    <line
                      x1="0"
                      y1="1"
                      x2="100%"
                      y2="1"
                      stroke="#94A3B8"
                      strokeWidth="2"
                      strokeDasharray="10 10"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </div>
              </div>

              {/* Step 1 - Create Profile */}
              <motion.div
                className="relative z-10"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-[85px] h-[85px] bg-white rounded-full flex items-center justify-center border-[4px] border-black mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <span className="text-5xl font-black text-pink-500">1</span>
                  </div>
                  <h3 className="text-xl font-black text-black mb-2">
                    Create Profile
                  </h3>
                  <p className="text-sm text-gray-800 leading-relaxed">
                    Sign up for free and customize your avatar.
                  </p>
                </div>
              </motion.div>

              {/* Step 2 - Pick a Course */}
              <motion.div
                className="relative z-10"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-[85px] h-[85px] bg-yellow-400 rounded-full flex items-center justify-center border-[4px] border-black mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <span className="text-5xl font-black text-black">2</span>
                  </div>
                  <h3 className="text-xl font-black text-black mb-2">
                    Pick a Course
                  </h3>
                  <p className="text-sm text-gray-800 leading-relaxed">
                    Choose Math, Reading, or Science adventures.
                  </p>
                </div>
              </motion.div>

              {/* Step 3 - Play & Learn */}
              <motion.div
                className="relative z-10"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-[85px] h-[85px] bg-teal-400 rounded-full flex items-center justify-center border-[4px] border-black mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <span className="text-5xl font-black text-white">3</span>
                  </div>
                  <h3 className="text-xl font-black text-black mb-2">
                    Play & Learn
                  </h3>
                  <p className="text-sm text-gray-800 leading-relaxed">
                    Start the game and collect rewards!
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Thinking Character Divider */}
        <div className="relative w-full" style={{ height: '400px' }}>
          {/* Smooth gradient transition from blue-200 to blue-200 */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-200 to-blue-200"></div>

          {/* Character Image - Right side */}
          <motion.div
            className="absolute bottom-0 right-0 z-10"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <img
              src="/mikir.png"
              alt="SINAUIN Thinking Character"
              className="h-[600px] w-auto object-contain"
            />
          </motion.div>
        </div>

        {/* FAQ Section */}
        <div className="relative bg-gradient-to-b from-blue-200 via-blue-50 to-white py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-black text-black mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-gray-600 text-lg">
                Punya pertanyaan? Kami punya jawabannya!
              </p>
            </motion.div>

            {/* FAQ Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* FAQ 1 */}
              <motion.div
                className="bg-white rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === 0 ? null : 0)}
                  className="w-full p-5 text-left flex items-center justify-between hover:bg-blue-50 transition-colors"
                  aria-expanded={openFAQ === 0}
                >
                  <h3 className="text-lg font-black text-black pr-4">
                    Apakah SINAUIN gratis?
                  </h3>
                  <span className="flex-shrink-0 text-2xl font-bold transition-transform duration-300" style={{ transform: openFAQ === 0 ? 'rotate(45deg)' : 'rotate(0deg)' }}>
                    +
                  </span>
                </button>
                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{ maxHeight: openFAQ === 0 ? '200px' : '0' }}
                >
                  <div className="p-5 pt-0 text-sm text-gray-700 leading-relaxed">
                    Ya! SINAUIN 100% gratis untuk semua fitur. Tidak ada biaya tersembunyi atau premium subscription.
                  </div>
                </div>
              </motion.div>

              {/* FAQ 2 */}
              <motion.div
                className="bg-white rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.15 }}
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === 1 ? null : 1)}
                  className="w-full p-5 text-left flex items-center justify-between hover:bg-blue-50 transition-colors"
                  aria-expanded={openFAQ === 1}
                >
                  <h3 className="text-lg font-black text-black pr-4">
                    Untuk usia berapa SINAUIN cocok?
                  </h3>
                  <span className="flex-shrink-0 text-2xl font-bold transition-transform duration-300" style={{ transform: openFAQ === 1 ? 'rotate(45deg)' : 'rotate(0deg)' }}>
                    +
                  </span>
                </button>
                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{ maxHeight: openFAQ === 1 ? '200px' : '0' }}
                >
                  <div className="p-5 pt-0 text-sm text-gray-700 leading-relaxed">
                    SINAUIN dirancang untuk semua usia! Dari anak SD hingga remaja SMA bisa belajar dengan cara yang fun dan interaktif.
                  </div>
                </div>
              </motion.div>

              {/* FAQ 3 */}
              <motion.div
                className="bg-white rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === 2 ? null : 2)}
                  className="w-full p-5 text-left flex items-center justify-between hover:bg-blue-50 transition-colors"
                  aria-expanded={openFAQ === 2}
                >
                  <h3 className="text-lg font-black text-black pr-4">
                    Apakah aman untuk anak-anak?
                  </h3>
                  <span className="flex-shrink-0 text-2xl font-bold transition-transform duration-300" style={{ transform: openFAQ === 2 ? 'rotate(45deg)' : 'rotate(0deg)' }}>
                    +
                  </span>
                </button>
                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{ maxHeight: openFAQ === 2 ? '200px' : '0' }}
                >
                  <div className="p-5 pt-0 text-sm text-gray-700 leading-relaxed">
                    Sangat aman! Kami menjaga privasi data siswa dan menyediakan lingkungan belajar yang aman dengan moderasi konten.
                  </div>
                </div>
              </motion.div>

              {/* FAQ 4 */}
              <motion.div
                className="bg-white rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.25 }}
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === 3 ? null : 3)}
                  className="w-full p-5 text-left flex items-center justify-between hover:bg-blue-50 transition-colors"
                  aria-expanded={openFAQ === 3}
                >
                  <h3 className="text-lg font-black text-black pr-4">
                    Berapa lama waktu belajar yang disarankan per hari?
                  </h3>
                  <span className="flex-shrink-0 text-2xl font-bold transition-transform duration-300" style={{ transform: openFAQ === 3 ? 'rotate(45deg)' : 'rotate(0deg)' }}>
                    +
                  </span>
                </button>
                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{ maxHeight: openFAQ === 3 ? '200px' : '0' }}
                >
                  <div className="p-5 pt-0 text-sm text-gray-700 leading-relaxed">
                    Kami merekomendasikan 20-30 menit per hari. Tapi siswa bisa belajar sesuai kecepatan mereka sendiri!
                  </div>
                </div>
              </motion.div>

              {/* FAQ 5 */}
              <motion.div
                className="bg-white rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === 4 ? null : 4)}
                  className="w-full p-5 text-left flex items-center justify-between hover:bg-blue-50 transition-colors"
                  aria-expanded={openFAQ === 4}
                >
                  <h3 className="text-lg font-black text-black pr-4">
                    Bisa diakses dari perangkat apa saja?
                  </h3>
                  <span className="flex-shrink-0 text-2xl font-bold transition-transform duration-300" style={{ transform: openFAQ === 4 ? 'rotate(45deg)' : 'rotate(0deg)' }}>
                    +
                  </span>
                </button>
                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{ maxHeight: openFAQ === 4 ? '200px' : '0' }}
                >
                  <div className="p-5 pt-0 text-sm text-gray-700 leading-relaxed">
                    SINAUIN bisa diakses melalui web browser di desktop, laptop, tablet, atau smartphone. Tidak perlu download aplikasi!
                  </div>
                </div>
              </motion.div>

              {/* FAQ 6 */}
              <motion.div
                className="bg-white rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.35 }}
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === 5 ? null : 5)}
                  className="w-full p-5 text-left flex items-center justify-between hover:bg-blue-50 transition-colors"
                  aria-expanded={openFAQ === 5}
                >
                  <h3 className="text-lg font-black text-black pr-4">
                    Apakah orang tua bisa memantau progress anak?
                  </h3>
                  <span className="flex-shrink-0 text-2xl font-bold transition-transform duration-300" style={{ transform: openFAQ === 5 ? 'rotate(45deg)' : 'rotate(0deg)' }}>
                    +
                  </span>
                </button>
                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{ maxHeight: openFAQ === 5 ? '200px' : '0' }}
                >
                  <div className="p-5 pt-0 text-sm text-gray-700 leading-relaxed">
                    Ya! Orang tua memiliki akses ke dashboard untuk melihat progress belajar, achievement, dan aktivitas anak mereka.
                  </div>
                </div>
              </motion.div>

              {/* FAQ 7 */}
              <motion.div
                className="bg-white rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === 6 ? null : 6)}
                  className="w-full p-5 text-left flex items-center justify-between hover:bg-blue-50 transition-colors"
                  aria-expanded={openFAQ === 6}
                >
                  <h3 className="text-lg font-black text-black pr-4">
                    Apa saja mata pelajaran yang tersedia?
                  </h3>
                  <span className="flex-shrink-0 text-2xl font-bold transition-transform duration-300" style={{ transform: openFAQ === 6 ? 'rotate(45deg)' : 'rotate(0deg)' }}>
                    +
                  </span>
                </button>
                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{ maxHeight: openFAQ === 6 ? '200px' : '0' }}
                >
                  <div className="p-5 pt-0 text-sm text-gray-700 leading-relaxed">
                    Saat ini kami menyediakan Matematika, Science, dan Reading. Lebih banyak mata pelajaran akan segera hadir!
                  </div>
                </div>
              </motion.div>

              {/* FAQ 8 */}
              <motion.div
                className="bg-white rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.45 }}
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === 7 ? null : 7)}
                  className="w-full p-5 text-left flex items-center justify-between hover:bg-blue-50 transition-colors"
                  aria-expanded={openFAQ === 7}
                >
                  <h3 className="text-lg font-black text-black pr-4">
                    Bagaimana cara mendaftar?
                  </h3>
                  <span className="flex-shrink-0 text-2xl font-bold transition-transform duration-300" style={{ transform: openFAQ === 7 ? 'rotate(45deg)' : 'rotate(0deg)' }}>
                    +
                  </span>
                </button>
                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{ maxHeight: openFAQ === 7 ? '200px' : '0' }}
                >
                  <div className="p-5 pt-0 text-sm text-gray-700 leading-relaxed">
                    Klik tombol &quot;Mulai Gratis&quot; di atas, isi informasi dasar, dan langsung mulai belajar! Proses registrasi hanya 2 menit.
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Contact CTA */}
            <div className="text-center mt-12">
              <p className="text-gray-600 text-base">
                Masih punya pertanyaan lain?{' '}
                <a href="/contact" className="text-blue-600 font-bold hover:underline">
                  Hubungi kami
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Running Text */}
        <div className="relative bg-white py-4 overflow-hidden border-t-[12px] border-b-[12px]" style={{ borderColor: '#7dd3d8' }}>
          <style jsx>{`
            @keyframes scroll {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(-50%);
              }
            }
            .animate-scroll {
              animation: scroll 30s linear infinite;
            }
          `}</style>
          <div className="flex whitespace-nowrap animate-scroll">
            {[...Array(20)].map((_, i) => (
              <span key={i} className="text-6xl md:text-8xl font-extrabold mx-16" style={{ letterSpacing: '0.15em', fontFamily: 'Impact, Arial Black, sans-serif', fontWeight: 900, color: '#a8d8dc' }}>
                SINAUIN
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="relative bg-gradient-to-b from-white via-blue-50 to-blue-200 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              {/* About SINAUIN Section */}
              <div>
                <div className="inline-block mb-6">
                  <img
                    src="/SINAUIN.png"
                    alt="SINAUIN"
                    className="h-25 w-auto object-contain"
                  />
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Membantu Anda mencapai keseimbangan pembelajaran dan kesehatan optimal dengan teknologi AI.
                </p>
              </div>

              {/* Navigasi */}
              <div>
                <h3 className="text-lg font-black text-black mb-6">Navigasi</h3>
                <ul className="space-y-3">
                  <li>
                    <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors text-sm">
                      Beranda
                    </a>
                  </li>
                  <li>
                    <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors text-sm">
                      Fitur Unggulan
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors text-sm">
                      Blog Artikel
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors text-sm">
                      Tentang Kami
                    </a>
                  </li>
                  <li>
                    <a href="/contact" className="text-gray-700 hover:text-blue-600 transition-colors text-sm">
                      Hubungi Kami
                    </a>
                  </li>
                </ul>
              </div>

              {/* Sumber Daya */}
              <div>
                <h3 className="text-lg font-black text-black mb-6">Sumber Daya</h3>
                <ul className="space-y-3">
                  <li>
                    <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors text-sm">
                      Visi Misi
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors text-sm">
                      Komitmen Kami
                    </a>
                  </li>
                  <li>
                    <a href="#faq" className="text-gray-700 hover:text-blue-600 transition-colors text-sm">
                      FAQ
                    </a>
                  </li>
                </ul>
              </div>

              {/* Hubungi Kami */}
              <div>
                <h3 className="text-lg font-black text-black mb-6">Hubungi Kami</h3>
                <div className="flex gap-4">
                  <a href="#" className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border-2 border-black hover:bg-yellow-400 transition-colors">
                    <span className="text-2xl">📧</span>
                  </a>
                  <a href="#" className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border-2 border-black hover:bg-yellow-400 transition-colors">
                    <span className="text-2xl">📞</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t-2 pt-8" style={{ borderColor: '#7dd3d8' }}>
              <div className="flex flex-col md:flex-row justify-between items-center">
                <p className="text-gray-700 text-sm mb-4 md:mb-0">
                  © 2024 SINAUIN. Semua hak dilindungi.
                </p>
                <p className="text-gray-700 text-sm">
                  Dibuat dengan ❤️ untuk kesehatan optimal
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
    
  );
}

