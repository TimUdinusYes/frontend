"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import {
  getCurrentUserProfile,
  getCurrentUserDetailProfile,
} from "@/lib/profile";
import { getBadgeById } from "@/lib/badges";
import UserProfileModal from "@/components/UserProfileModal";
import AuthModal from "@/components/AuthModal";
import HamburgerMenu from "@/components/HamburgerMenu";
import type { Profile, UserProfile, Badge } from "@/types/database";

export default function FeatureNavbar() {
  const [user, setUser] = useState<Profile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [badge, setBadge] = useState<Badge | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const profile = await getCurrentUserProfile();
      setUser(profile);

      if (profile) {
        const detailProfile = await getCurrentUserDetailProfile();
        setUserProfile(detailProfile);

        // Fetch badge if user has one
        if (detailProfile?.badge_id) {
          const badgeData = await getBadgeById(detailProfile.badge_id);
          setBadge(badgeData);
        }
      }
    }

    loadUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Hamburger Menu + Logo */}
          <div className="flex items-center gap-4">
            <HamburgerMenu />
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

          {/* User Navigation */}
          <div className="flex items-center gap-3">
            {!user ? (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-6 py-2 bg-teal-400 border-2 border-black text-black rounded-xl hover:bg-teal-500 transition-all font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
              >
                Login
              </button>
            ) : (
              <>
                {/* User Avatar */}
                <div className="hidden sm:flex items-center gap-3">
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
                    <p className="text-sm font-black text-black">
                      {userProfile?.nama || user.username}
                    </p>
                    <p className="text-xs font-bold text-gray-600">{user.role}</p>
                  </div>
                </div>

                {/* Role-based buttons */}
                {user.role === "superadmin" && (
                  <Link
                    href="/admin/dashboard"
                    className="hidden md:block px-4 py-2 bg-purple-400 border-2 border-black text-black text-sm rounded-xl hover:bg-purple-500 transition-all font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
                  >
                    Admin
                  </Link>
                )}
                {user.role === "mentor" && (
                  <Link
                    href="/mentor/dashboard"
                    className="hidden md:block px-4 py-2 bg-green-400 border-2 border-black text-black text-sm rounded-xl hover:bg-green-500 transition-all font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
                  >
                    Dashboard
                  </Link>
                )}

                {/* Profile & Logout buttons */}
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="hidden sm:block px-4 py-2 bg-indigo-400 border-2 border-black text-black text-sm rounded-xl hover:bg-indigo-500 transition-all font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
                >
                  Profile
                </button>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-red-400 border-2 border-black text-black text-sm rounded-xl hover:bg-red-500 transition-all font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
                >
                  Logout
                </button>
              </>
            )}
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
