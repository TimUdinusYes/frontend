'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { UserProfile, UserProfileUpdate, Gender } from '@/types/database'

interface UserProfileFormProps {
  userId?: string // UUID from auth.users.id
  onSuccess?: () => void
}

export default function UserProfileForm({ userId, onSuccess }: UserProfileFormProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null)

  const [formData, setFormData] = useState({
    nama: '',
    tanggal_lahir: '',
    gender: 'Pria' as Gender,
    interest: [] as string[],
    avatar_url: '',
  })

  const [newInterest, setNewInterest] = useState('')

  useEffect(() => {
    if (userId) {
      loadProfile()
    }
  }, [userId])

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setProfile(data)
        setFormData({
          nama: data.nama || '',
          tanggal_lahir: data.tanggal_lahir || '',
          gender: data.gender || 'male',
          interest: data.interest || [],
          avatar_url: data.avatar_url || '',
        })
      }
    } catch (error: any) {
      console.error('Error loading profile:', error)
      setMessage({
        type: 'error',
        text: 'Failed to load profile'
      })
    }
  }

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

  const handleAddInterest = () => {
    if (newInterest.trim() && !formData.interest.includes(newInterest.trim())) {
      setFormData(prev => ({
        ...prev,
        interest: [...prev.interest, newInterest.trim()]
      }))
      setNewInterest('')
    }
  }

  const handleRemoveInterest = (interestToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      interest: prev.interest.filter(i => i !== interestToRemove)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (!userId) {
        throw new Error('User ID is required')
      }

      const profileData: UserProfileUpdate = {
        nama: formData.nama,
        tanggal_lahir: formData.tanggal_lahir || null,
        gender: formData.gender,
        interest: formData.interest,
        avatar_url: formData.avatar_url || null,
      }

      if (profile) {
        // Update existing profile
        const { error } = await supabase
          .from('user_profiles')
          .update(profileData)
          .eq('user_id', userId)

        if (error) throw error
      } else {
        // Insert new profile
        const { error } = await supabase
          .from('user_profiles')
          .insert({
            ...profileData,
            user_id: userId,
          })

        if (error) throw error
      }

      setMessage({
        type: 'success',
        text: 'Profile saved successfully!'
      })

      if (onSuccess) {
        onSuccess()
      }

      // Reload profile
      await loadProfile()
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to save profile'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          User Profile
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              {formData.avatar_url ? (
                <img
                  src={formData.avatar_url}
                  alt="Avatar"
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <svg
                    className="w-16 h-16 text-gray-400"
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
            </div>

            <label className="cursor-pointer bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
              <span>{uploading ? 'Uploading...' : 'Upload Avatar'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          {/* Nama */}
          <div>
            <label htmlFor="nama" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nama <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="nama"
              required
              value={formData.nama}
              onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Enter your name"
              disabled={loading}
            />
          </div>

          {/* Tanggal Lahir */}
          <div>
            <label htmlFor="tanggal_lahir" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tanggal Lahir
            </label>
            <input
              type="date"
              id="tanggal_lahir"
              value={formData.tanggal_lahir}
              onChange={(e) => setFormData(prev => ({ ...prev, tanggal_lahir: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              disabled={loading}
            />
          </div>

          {/* Gender */}
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Jenis Kelamin <span className="text-red-500">*</span>
            </label>
            <select
              id="gender"
              required
              value={formData.gender}
              onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as Gender }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              disabled={loading}
            >
              <option value="Pria">Pria</option>
              <option value="Wanita">Wanita</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          {/* Interest */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Interest
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddInterest()
                  }
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Add an interest"
                disabled={loading}
              />
              <button
                type="button"
                onClick={handleAddInterest}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                disabled={loading}
              >
                Add
              </button>
            </div>

            {formData.interest.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.interest.map((interest, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200"
                  >
                    {interest}
                    <button
                      type="button"
                      onClick={() => handleRemoveInterest(interest)}
                      className="ml-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200"
                      disabled={loading}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Message */}
          {message && (
            <div
              className={`rounded-md p-4 ${
                message.type === 'error'
                  ? 'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200'
                  : 'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200'
              }`}
            >
              <p className="text-sm">{message.text}</p>
            </div>
          )}

          {/* Submit & Cancel Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {loading ? 'Menyimpan...' : profile ? 'Perbarui Profil' : 'Buat Profil'}
            </button>
            <button
              type="button"
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-semibold"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
