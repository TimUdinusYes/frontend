import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { UserProfile } from "../types"

export const useUserProfile = () => {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)

  const handleSetCurrentUser = useCallback((user: UserProfile) => {
    setCurrentUser(user)
  }, [])

  const loadUserProfile = async () => {
    try {
      setInitialLoading(true)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login?message=Silakan+login+terlebih+dahulu+untuk+menggunakan+PeerConnect')
        return
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push('/login?message=Silakan+login+terlebih+dahulu')
        return
      }

      // Load user profile
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('user_id, nama, interest, interest_id, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error || !profile) {
        router.push('/profile?message=Silakan+lengkapi+profil+Anda')
        return
      }

      if (!profile.interest || !profile.interest.trim()) {
        router.push('/profile?message=Anda+belum+mengisi+minat')
        return
      }

      // Load role from user table
      const { data: userData } = await supabase
        .from('user')
        .select('role')
        .eq('id', user.id)
        .single()

      const profileWithRole = {
        ...profile,
        role: userData?.role
      }

      setCurrentUser(profileWithRole)
      setInitialLoading(false)
    } catch (error) {
      console.error('Error loading user profile:', error)
      setInitialLoading(false)
      router.push('/profile?message=Terjadi+kesalahan')
    }
  }

  useEffect(() => {
    loadUserProfile()
  }, [])

  return {
    currentUser,
    initialLoading,
    setCurrentUser: handleSetCurrentUser,
    loadUserProfile
  }
}
