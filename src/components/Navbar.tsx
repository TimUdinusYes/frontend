"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import {
  getCurrentUserProfile,
  getCurrentUserDetailProfile,
} from "@/lib/profile";
import { getUserTotalXP, getUnlockedBadgesByLevel } from "@/lib/badges";
import { calculateLevel } from "@/lib/levelSystem";
import UserProfileModal from "@/components/UserProfileModal";
import AuthModal from "@/components/AuthModal";
import type { Profile, UserProfile, Badge } from "@/types/database";

export default function Navbar() {
  const [user, setUser] = useState<Profile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const profile = await getCurrentUserProfile();
      setUser(profile);

      if (profile) {
        const detailProfile = await getCurrentUserDetailProfile();
        setUserProfile(detailProfile);

        // Fetch all unlocked badges based on user level
        const totalXP = await getUserTotalXP(profile.id);
        const userLevel = calculateLevel(totalXP);
        console.log(`[Navbar] Total XP: ${totalXP}, User Level: ${userLevel}`);
        const unlockedBadges = await getUnlockedBadgesByLevel(userLevel);
        console.log(`[Navbar] Unlocked badges count: ${unlockedBadges.length}`, unlockedBadges);
        setBadges(unlockedBadges);
      }
    }

    loadUser();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest(".dropdown-container")) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isDropdownOpen]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest(".mobile-menu-container") && !target.closest(".hamburger-button")) {
        setIsMobileMenuOpen(false);
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isMobileMenuOpen]);

  // Track scroll position
  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 50);
    }

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const features = [
    {
      path: "/games",
      title: "Games",
      description: "Educational Games Platform",
    },
    {
      path: "/Multi-Source-Knowledge",
      title: "Multi-Source Knowledge",
      description: "Multi-Source Knowledge Base",
    },
    {
      path: "/n8n-workflow",
      title: "N8N Workflow",
      description: "Workflow Automation System",
    },
    {
      path: "/PeerConnect",
      title: "Peer Connect",
      description: "Peer-to-Peer Connection Platform",
    },
    {
      path: "/TaskIntegrator",
      title: "AI Learning Analytics",
      description: "Task Integration & Management",
    },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "pt-4" : ""
        }`}
    >
      <div
        className={`max-w-7xl mx-auto transition-all duration-300 ${isScrolled ? "px-4 sm:px-6 lg:px-8" : "px-0"
          }`}
      >
        <div
          className={`flex justify-between items-center h-16 transition-all duration-300 ${isScrolled
            ? "bg-white border-2 border-black rounded-full px-8"
            : "bg-transparent px-4 sm:px-6 lg:px-8"
            }`}
        >
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/home">
              <Image
                src="/SINAUIN.png"
                alt="SINAUIN"
                width={120}
                height={40}
                className="object-contain"
              />
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/home"
              className="px-4 py-2 bg-blue-400 text-black font-black border-2 border-black rounded-lg hover:bg-blue-500 transition-colors"
            >
              Home
            </Link>

            {/* Features Dropdown */}
            <div className="relative dropdown-container">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="px-4 py-2 bg-blue-400 text-black font-black border-2 border-black rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2"
              >
                Features
                <svg
                  className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""
                    }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full mt-2 w-48 bg-blue-400 border-2 border-black rounded-lg overflow-hidden z-50">
                  {features.map((feature, index) => (
                    <Link
                      key={feature.path}
                      href={feature.path}
                      onClick={() => setIsDropdownOpen(false)}
                      className={`block px-4 py-2 text-black font-bold hover:bg-blue-500 transition-colors ${index !== features.length - 1 ? 'border-b border-black' : ''
                        }`}
                    >
                      {feature.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Desktop User Navigation */}
          <div className="hidden md:flex items-center gap-3">
            {!user ? (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-6 py-2 bg-teal-400 border-2 border-black text-black rounded-xl hover:bg-teal-500 transition-all font-black"
              >
                Login
              </button>
            ) : (
              <>
                {/* User Avatar */}
                {userProfile?.avatar_url ? (
                  <img
                    src={userProfile.avatar_url}
                    alt={user.username}
                    className="w-10 h-10 rounded-full object-cover border-2 border-black"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-400 border-2 border-black flex items-center justify-center text-black font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-right">
                  <p className={`text-sm font-black ${isScrolled ? 'text-black' : 'text-black'
                    }`}>
                    {userProfile?.nama || user.username}
                  </p>
                  <p className="text-xs font-bold text-gray-600">{user.role}</p>
                  {badges.length > 0 ? (
                    <div className="flex items-center justify-end gap-1 mt-1 flex-wrap">
                      {badges.map((badge) => (
                        badge.gambar && (
                          <img
                            key={badge.badge_id}
                            src={badge.gambar}
                            alt={badge.nama}
                            className="w-4 h-4 object-contain"
                            title={badge.nama}
                          />
                        )
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-gray-600">No Badge</p>
                  )}
                </div>
                {user.role === "superadmin" && (
                  <Link
                    href="/admin/dashboard"
                    className="px-4 py-2 bg-purple-400 border-2 border-black text-black text-sm rounded-xl hover:bg-purple-500 transition-all font-black"
                  >
                    Admin
                  </Link>
                )}
                {user.role === "mentor" && (
                  <Link
                    href="/mentor/dashboard"
                    className="px-4 py-2 bg-green-400 border-2 border-black text-black text-sm rounded-xl hover:bg-green-500 transition-all font-black"
                  >
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="px-4 py-2 bg-indigo-400 border-2 border-black text-black text-sm rounded-xl hover:bg-indigo-500 transition-all font-black"
                >
                  Profile
                </button>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-red-400 border-2 border-black text-black text-sm rounded-xl hover:bg-red-500 transition-all font-black"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          {/* Hamburger Menu Button (Mobile) */}
          <button
            onClick={toggleMobileMenu}
            className="hamburger-button md:hidden flex flex-col justify-center items-center gap-1.5 w-8 h-8"
            aria-label="Toggle menu"
          >
            <span
              className={`block w-6 h-0.5 bg-black transition-all duration-300 ${isScrolled ? "bg-black" : "bg-black"
                } ${isMobileMenuOpen ? "rotate-45 translate-y-2" : ""}`}
            ></span>
            <span
              className={`block w-6 h-0.5 bg-black transition-all duration-300 ${isScrolled ? "bg-black" : "bg-black"
                } ${isMobileMenuOpen ? "opacity-0" : ""}`}
            ></span>
            <span
              className={`block w-6 h-0.5 bg-black transition-all duration-300 ${isScrolled ? "bg-black" : "bg-black"
                } ${isMobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}
            ></span>
          </button>
        </div>

        {/* Mobile Menu (Slide-Down) */}
        <div
          className={`mobile-menu-container md:hidden overflow-y-auto transition-all duration-300 ease-in-out ${isMobileMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
            }`}
        >
          <div className="bg-gradient-to-b from-blue-100 to-blue-200 border-2 border-t-0 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            {/* Mobile Navigation Links */}
            <div className="px-4 py-4 space-y-3">
              <Link
                href="/home"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-3 bg-blue-400 border-2 border-black rounded-lg font-black text-black hover:bg-blue-500 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
              >
                Home
              </Link>

              {/* Features Section */}
              <div>
                <p className="px-2 py-1 text-sm font-bold text-black mb-2">Features:</p>
                <div className="space-y-2">
                  {features.map((feature) => (
                    <Link
                      key={feature.path}
                      href={feature.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-4 py-2.5 bg-blue-400 border-2 border-black rounded-lg font-bold text-black hover:bg-blue-500 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
                    >
                      {feature.title}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile User Navigation */}
            <div className="px-4 pb-4 space-y-3">
              {!user ? (
                <button
                  onClick={() => {
                    setShowAuthModal(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 bg-teal-400 border-2 border-black rounded-lg font-black text-black hover:bg-teal-500 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
                >
                  Login
                </button>
              ) : (
                <>
                  {/* User Info */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-white border-2 border-black rounded-lg">
                    {userProfile?.avatar_url ? (
                      <img
                        src={userProfile.avatar_url}
                        alt={user.username}
                        className="w-12 h-12 rounded-full object-cover border-2 border-black"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xl border-2 border-black">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-black text-black">{userProfile?.nama || user.username}</p>
                      <p className="text-sm font-bold text-gray-600">{user.role}</p>
                    </div>
                  </div>

                  {/* Role-based buttons */}
                  {user.role === "superadmin" && (
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-4 py-3 bg-purple-400 border-2 border-black rounded-lg font-black text-black hover:bg-purple-500 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  {user.role === "mentor" && (
                    <Link
                      href="/mentor/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-4 py-3 bg-green-400 border-2 border-black rounded-lg font-black text-black hover:bg-green-500 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
                    >
                      Mentor Dashboard
                    </Link>
                  )}

                  {/* Profile Button */}
                  <button
                    onClick={() => {
                      setShowProfileModal(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 bg-indigo-400 border-2 border-black rounded-lg font-black text-black hover:bg-indigo-500 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
                  >
                    Profile
                  </button>

                  {/* Logout Button */}
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-3 bg-red-400 border-2 border-black rounded-lg font-black text-black hover:bg-red-500 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && user && (
        <UserProfileModal
          userId={user.id}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          initialMode="login"
        />
      )}
    </nav>
  );
}
