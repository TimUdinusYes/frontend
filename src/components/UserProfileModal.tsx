'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getUserTotalXP, getBadgeByLevel } from '@/lib/badges'
import { calculateLevel, getLevelName } from '@/lib/levelSystem'
import { isUsernameAvailable } from '@/lib/profile'
import type { UserProfile, Badge, Gender, UserProfileUpdate, Profile } from '@/types/database'

interface UserProfileModalProps {
  userId: string
  onClose: () => void
}

export default function UserProfileModal({ userId, onClose }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [userAccount, setUserAccount] = useState<Profile | null>(null)
  const [badge, setBadge] = useState<Badge | null>(null)
  const [userLevel, setUserLevel] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null)

  const [formData, setFormData] = useState({
    username: '',
    nama: '',
    tanggal_lahir: '',
    gender: 'Pria' as Gender,
    interest: '',
    avatar_url: '',
  })

  // State for email and password change
  const [userEmail, setUserEmail] = useState('')
  const [emailFormData, setEmailFormData] = useState({
    newEmail: '',
  })
  const [passwordFormData, setPasswordFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  })
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [showEmailSection, setShowEmailSection] = useState(false)

  useEffect(() => {
    loadProfile()

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [userId])

  const loadProfile = async () => {
    try {
      setLoading(true)

      // Load user_profiles data
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Error loading profile:', error)
        return
      }

      // Load user account data (username, email)
      const { data: accountData, error: accountError } = await supabase
        .from('user')
        .select('*')
        .eq('id', userId)
        .single()

      if (accountError) {
        console.error('Error loading user account:', accountError)
      }

      if (data) {
        setProfile(data)
        setUserAccount(accountData)

        // Set form data
        setFormData({
          username: accountData?.username || '',
          nama: data.nama || '',
          tanggal_lahir: data.tanggal_lahir || '',
          gender: data.gender || 'Pria',
          interest: data.interest || '',
          avatar_url: data.avatar_url || '',
        })

        // Fetch current badge based on level (ranking system)
        const totalXP = await getUserTotalXP(userId)
        const level = calculateLevel(totalXP)
        setUserLevel(level)
        const currentBadge = await getBadgeByLevel(level)
        setBadge(currentBadge)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load current user email
  const loadUserEmail = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email) {
      setUserEmail(user.email)
      setEmailFormData({ newEmail: user.email })
    }
  }

  useEffect(() => {
    loadUserEmail()
  }, [])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      setMessage(null)

      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }))

      setMessage({
        type: 'success',
        text: 'Avatar uploaded successfully!'
      })
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setMessage(null)

      // 1. Validate username
      if (!formData.username || formData.username.trim().length < 3) {
        throw new Error('Username must be at least 3 characters')
      }

      // Check if username changed and is available
      if (formData.username !== userAccount?.username) {
        const available = await isUsernameAvailable(formData.username)
        if (!available) {
          throw new Error('Username sudah digunakan, silakan pilih username lain')
        }
      }

      // 2. Update Password if provided
      if (showPasswordSection && passwordFormData.newPassword) {
        if (passwordFormData.newPassword.length < 6) {
          throw new Error('Password must be at least 6 characters')
        }
        if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
          throw new Error('Passwords do not match')
        }

        const { error: authError } = await supabase.auth.updateUser({
          password: passwordFormData.newPassword
        })

        if (authError) throw authError
      }

      // 3. Update username in user table
      if (formData.username !== userAccount?.username) {
        const { error: userError } = await supabase
          .from('user')
          .update({ username: formData.username })
          .eq('id', userId)

        if (userError) throw userError
      }

      // 4. Update Profile in user_profiles table
      const profileData: UserProfileUpdate = {
        nama: formData.nama,
        tanggal_lahir: formData.tanggal_lahir || null,
        gender: formData.gender,
        interest: formData.interest || null,
        avatar_url: formData.avatar_url || null,
        ...(formData.interest !== profile?.interest && { interest_id: null })
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(profileData)
        .eq('user_id', userId)

      if (error) throw error

      setMessage({
        type: 'success',
        text: showPasswordSection && passwordFormData.newPassword
          ? 'Profile and password updated successfully!'
          : 'Profile updated successfully!'
      })

      // Reset password form
      setPasswordFormData({ newPassword: '', confirmPassword: '' })
      setShowPasswordSection(false)

      // Reload profile
      await loadProfile()
      setIsEditMode(false)
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to update profile'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEmailChange = async () => {
    try {
      setSaving(true)
      setMessage(null)

      if (!emailFormData.newEmail || emailFormData.newEmail === userEmail) {
        setMessage({ type: 'error', text: 'Please enter a new email address' })
        return
      }

      const { error } = await supabase.auth.updateUser({
        email: emailFormData.newEmail
      })

      if (error) throw error

      setMessage({
        type: 'success',
        text: 'Email update request sent! Please check your new email to confirm.'
      })
      setShowEmailSection(false)
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to update email'
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    try {
      setSaving(true)
      setMessage(null)

      if (!passwordFormData.newPassword) {
        setMessage({ type: 'error', text: 'Please enter a new password' })
        return
      }

      if (passwordFormData.newPassword.length < 6) {
        setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
        return
      }

      if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
        setMessage({ type: 'error', text: 'Passwords do not match' })
        return
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordFormData.newPassword
      })

      if (error) throw error

      setMessage({
        type: 'success',
        text: 'Password updated successfully!'
      })
      setPasswordFormData({ newPassword: '', confirmPassword: '' })
      setShowPasswordSection(false)
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to update password'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset form data to original profile data
    if (profile && userAccount) {
      setFormData({
        username: userAccount.username || '',
        nama: profile.nama || '',
        tanggal_lahir: profile.tanggal_lahir || '',
        gender: (profile.gender || 'Pria') as Gender,
        interest: profile.interest || '',
        avatar_url: profile.avatar_url || '',
      })
    }
    setEmailFormData({ newEmail: userEmail })
    setPasswordFormData({ newPassword: '', confirmPassword: '' })
    setShowEmailSection(false)
    setShowPasswordSection(false)
    setIsEditMode(false)
    setMessage(null)
  }

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isEditMode) {
      onClose()
    }
  }

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white border-2 border-black rounded-2xl p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-black"></div>
            <span className="text-black font-black">Loading profile...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={handleBackdropClick}>
        <div className="bg-white border-2 border-black rounded-2xl p-8 max-w-md mx-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-black font-black text-center">Profile not found</p>
          <button
            onClick={onClose}
            className="mt-4 w-full bg-red-400 border-2 border-black text-black py-2 px-4 rounded-xl hover:bg-red-500 transition-all font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-400 to-pink-400 border-b-2 border-black text-black p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black">User Profile</h2>
            <button
              onClick={onClose}
              className="text-black hover:text-gray-700 transition-colors p-1 rounded-lg hover:bg-white/20 font-bold"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Message */}
          {message && (
            <div
              className={`rounded-xl p-4 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${message.type === 'error'
                ? 'bg-red-400 text-black'
                : 'bg-green-400 text-black'
                }`}
            >
              <p className="text-sm font-black">{message.text}</p>
            </div>
          )}

          {/* Avatar and Basic Info */}
          <div className="flex flex-col items-center space-y-4">
            {formData.avatar_url ? (
              <img
                src={formData.avatar_url}
                alt={formData.nama}
                className="w-32 h-32 rounded-full object-cover border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-yellow-400 border-4 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <svg
                  className="w-16 h-16 text-black"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}

            {isEditMode && (
              <label className="cursor-pointer bg-pink-400 border-2 border-black text-black px-4 py-2 rounded-xl hover:bg-pink-500 transition-all font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5">
                <span>{uploading ? 'Uploading...' : 'Upload Avatar'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            )}

            {!isEditMode && (
              <div className="text-center">
                <h3 className="text-2xl font-black text-black">
                  {profile?.nama}
                </h3>
              </div>
            )}
          </div>

          {/* Profile Details */}
          {isEditMode ? (
            /* Edit Mode - Form Fields */
            <div className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-black text-black mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/\s/g, '') }))}
                  className="w-full px-4 py-2 border-2 border-black rounded-xl focus:ring-2 focus:ring-black focus:border-transparent bg-white text-black font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  placeholder="username (min 3 karakter, tanpa spasi)"
                  minLength={3}
                />
                <p className="mt-1 text-xs font-semibold text-gray-600">
                  Username digunakan untuk login dan identitas unik Anda
                </p>
              </div>

              {/* Nama Lengkap */}
              <div>
                <label className="block text-sm font-black text-black mb-2">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                  className="w-full px-4 py-2 border-2 border-black rounded-xl focus:ring-2 focus:ring-black focus:border-transparent bg-white text-black font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  placeholder="Nama lengkap Anda"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tanggal Lahir */}
                <div>
                  <label className="block text-sm font-black text-black mb-2">
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    value={formData.tanggal_lahir}
                    onChange={(e) => setFormData(prev => ({ ...prev, tanggal_lahir: e.target.value }))}
                    className="w-full px-4 py-2 border-2 border-black rounded-xl focus:ring-2 focus:ring-black focus:border-transparent bg-white text-black font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-black text-black mb-2">
                    Jenis Kelamin <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.gender}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as Gender }))}
                    className="w-full px-4 py-2 border-2 border-black rounded-xl focus:ring-2 focus:ring-black focus:border-transparent bg-white text-black font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <option value="Pria">Pria</option>
                    <option value="Wanita">Wanita</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              {/* Interest */}
              <div>
                <label className="block text-sm font-black text-black mb-2">
                  Interest / Minat
                </label>
                <textarea
                  value={formData.interest}
                  onChange={(e) => setFormData(prev => ({ ...prev, interest: e.target.value }))}
                  placeholder="Contoh: Saya suka web development, coding, dan teknologi terbaru..."
                  className="w-full px-4 py-3 border-2 border-black rounded-xl focus:ring-2 focus:ring-black focus:border-transparent bg-white text-black font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] resize-none"
                  rows={3}
                />
                <p className="mt-2 text-sm font-bold text-gray-600">
                  Ceritakan minat atau hobi Anda secara bebas.
                </p>
              </div>

              {/* Password Change Section */}
              <div className="border-t-2 border-dashed border-black/20 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordSection(!showPasswordSection)}
                  className="flex items-center gap-2 text-sm font-black text-pink-500 hover:text-pink-600 transition-colors"
                >
                  <span className="text-lg">{showPasswordSection ? '−' : '+'}</span>
                  {showPasswordSection ? 'Batal Ganti Password' : 'Ganti Password'}
                </button>

                {showPasswordSection && (
                  <div className="mt-4 space-y-4 bg-pink-50 p-4 rounded-xl border-2 border-pink-200 animate-in fade-in slide-in-from-top-2">
                    <div>
                      <label className="block text-sm font-black text-black mb-2">
                        Password Baru
                      </label>
                      <input
                        type="password"
                        value={passwordFormData.newPassword}
                        onChange={(e) => setPasswordFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-4 py-2 border-2 border-black rounded-xl focus:ring-2 focus:ring-black focus:border-transparent bg-white text-black font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        placeholder="Minimal 6 karakter"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-black text-black mb-2">
                        Konfirmasi Password
                      </label>
                      <input
                        type="password"
                        value={passwordFormData.confirmPassword}
                        onChange={(e) => setPasswordFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-4 py-2 border-2 border-black rounded-xl focus:ring-2 focus:ring-black focus:border-transparent bg-white text-black font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        placeholder="Ulangi password baru"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* View Mode - Display Only */
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tanggal Lahir */}
                {profile?.tanggal_lahir && (
                  <div className="bg-white border-2 border-black rounded-xl p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-sm font-black text-black mb-1">Tanggal Lahir</p>
                    <p className="text-black font-semibold">
                      {new Date(profile.tanggal_lahir).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                )}

                {/* Gender */}
                <div className="bg-white border-2 border-black rounded-xl p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <p className="text-sm font-black text-black mb-1">Jenis Kelamin</p>
                  <p className="text-black font-semibold">{profile?.gender}</p>
                </div>
              </div>

              {/* Interest */}
              {profile?.interest && (
                <div className="bg-white border-2 border-black rounded-xl p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <p className="text-sm font-black text-black mb-2">Interest / Minat</p>
                  <p className="text-black font-medium leading-relaxed">
                    {profile.interest}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Badge Display */}
          <div>
            <h4 className="text-lg font-black text-black mb-3">
              Badge Ranking (Level {userLevel} - {getLevelName(userLevel)})
            </h4>
            {badge ? (
              <div className="flex items-center gap-4 p-4 bg-white border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {badge.gambar && (
                  <div className="flex-shrink-0">
                    <img
                      src={badge.gambar}
                      alt={badge.nama}
                      className="w-20 h-20 object-contain"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-black text-black">
                    {badge.nama}
                  </h3>
                  <p className="text-sm font-semibold text-gray-700 mt-1">
                    Badge untuk Level {badge.level_min}-{badge.level_max}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-white border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center">
                <svg
                  className="w-12 h-12 text-gray-500 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
                <p className="text-sm font-bold text-gray-700">
                  Belum memiliki badge
                </p>
                <p className="text-xs font-semibold text-gray-600 mt-1">
                  Raih XP untuk mendapatkan badge!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-black p-6 bg-blue-100 rounded-b-2xl">
          {isEditMode ? (
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="flex-1 bg-red-400 border-2 border-black text-black py-3 px-4 rounded-xl hover:bg-red-500 transition-all font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.nama}
                className="flex-1 bg-teal-400 border-2 border-black text-black py-3 px-4 rounded-xl hover:bg-teal-500 transition-all font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setIsEditMode(true)}
                className="flex-1 bg-green-400 border-2 border-black text-black py-3 px-4 rounded-xl hover:bg-green-500 transition-all font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
              >
                Edit Profile
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-400 border-2 border-black text-black py-3 px-4 rounded-xl hover:bg-gray-500 transition-all font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
              >
                Tutup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
