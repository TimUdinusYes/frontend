'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface MenuItem {
  label: string
  href: string
  icon: string
}

const menuItems: MenuItem[] = [
  { label: 'Home', href: '/home', icon: '🏠' },
  { label: 'Knowledge Base', href: '/knowledge-base', icon: '📚' },
  { label: 'Learning Path', href: '/n8n-workflow', icon: '🗺️' },
  { label: 'Quiz Game', href: '/quiz', icon: '🎮' },
  { label: 'Peer Connect', href: '/PeerConnect', icon: '💬' },
  { label: 'Mentor Dashboard', href: '/mentor-dashboard', icon: '👨‍🏫' },
]

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="relative">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 bg-white border-[3px] border-black rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
        aria-label="Menu"
      >
        <div className="w-6 h-6 flex flex-col justify-center gap-1.5">
          <span className={`block h-1 bg-black rounded transition-all ${isOpen ? 'rotate-45 translate-y-2.5' : ''}`}></span>
          <span className={`block h-1 bg-black rounded transition-all ${isOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block h-1 bg-black rounded transition-all ${isOpen ? '-rotate-45 -translate-y-2.5' : ''}`}></span>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu Container */}
          <div className="absolute top-full left-0 mt-2 w-64 bg-white border-[3px] border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] overflow-hidden z-50">
            {/* Header */}
            <div className="px-4 py-3 bg-blue-400 border-b-[3px] border-black">
              <p className="text-sm font-black text-black uppercase tracking-wide">
                Navigation
              </p>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {menuItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/home' && pathname?.startsWith(item.href))

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 font-bold transition-all ${
                      isActive
                        ? 'bg-yellow-300 text-black border-l-4 border-black'
                        : 'text-black hover:bg-blue-100 hover:border-l-4 hover:border-black'
                    }`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
