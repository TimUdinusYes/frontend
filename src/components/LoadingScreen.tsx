'use client'

import { useEffect } from 'react'
import { gsap } from 'gsap'

interface LoadingScreenProps {
  loading: boolean
}

export default function LoadingScreen({ loading }: LoadingScreenProps) {
  useEffect(() => {
    if (!loading) {
      // Trigger exit animation when loading becomes false
      const tl = gsap.timeline()

      tl.to('.clip-top', {
        clipPath: 'inset(0 0 100% 0)',
        duration: 1,
        ease: 'power4.inOut'
      })
      .to('.clip-bottom', {
        clipPath: 'inset(100% 0 0 0)',
        duration: 1,
        ease: 'power4.inOut'
      }, '-=1')
      .to('.loader', {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.inOut'
      })

      return () => {
        tl.kill()
      }
    } else {
      // Entrance animation when loading is true
      const tl = gsap.timeline()

      // Animate marquee text to center
      tl.to('.marquee', {
        top: '50%',
        duration: 1.5,
        ease: 'power3.out'
      })

      // Marquee scroll animation
      gsap.to('.marquee-container', {
        x: '-50%',
        duration: 20,
        ease: 'none',
        repeat: -1
      })

      return () => {
        tl.kill()
      }
    }
  }, [loading])

  const marqueeText = 'FASTLERN FASTLERN FASTLERN FASTLERN FASTLERN FASTLERN '

  return (
    <div className="loader fixed inset-0 z-[10000] w-screen h-screen bg-white overflow-hidden">
      {/* Top Clip - Black */}
      <div className="clip-top absolute top-0 w-full h-[33.3vh] bg-black overflow-hidden" style={{ clipPath: 'inset(0 0 0 0)' }}>
        <div className="marquee absolute left-1/2 -translate-x-1/2 w-[200vw]" style={{ top: '200%', transform: 'translate(-50%, -50%)' }}>
          <div className="marquee-container flex gap-8 whitespace-nowrap">
            <span className="text-[12vw] font-black text-white uppercase tracking-tighter">{marqueeText}</span>
            <span className="text-[12vw] font-black text-white uppercase tracking-tighter">{marqueeText}</span>
          </div>
        </div>
      </div>

      {/* Center Clip - White */}
      <div className="clip-center absolute top-[33.3vh] w-full h-[33.4vh] bg-white overflow-hidden">
        <div className="marquee absolute left-1/2 -translate-x-1/2 w-[200vw]" style={{ top: '200%', transform: 'translate(-50%, -50%)' }}>
          <div className="marquee-container flex gap-8 whitespace-nowrap">
            <span className="text-[12vw] font-black text-black uppercase tracking-tighter">{marqueeText}</span>
            <span className="text-[12vw] font-black text-black uppercase tracking-tighter">{marqueeText}</span>
          </div>
        </div>
      </div>

      {/* Bottom Clip - Black */}
      <div className="clip-bottom absolute bottom-0 w-full h-[33.3vh] bg-black overflow-hidden" style={{ clipPath: 'inset(0 0 0 0)' }}>
        <div className="marquee absolute left-1/2 -translate-x-1/2 w-[200vw]" style={{ top: '200%', transform: 'translate(-50%, -50%)' }}>
          <div className="marquee-container flex gap-8 whitespace-nowrap">
            <span className="text-[12vw] font-black text-white uppercase tracking-tighter">{marqueeText}</span>
            <span className="text-[12vw] font-black text-white uppercase tracking-tighter">{marqueeText}</span>
          </div>
        </div>
      </div>
    </div>
  )
}



