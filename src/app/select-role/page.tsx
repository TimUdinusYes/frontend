'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getCurrentUserProfile, updateProfile, upsertUserProfile } from '@/lib/profile'
import type { Profile, Gender } from '@/types/database'

export default function SelectRole() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [user, setUser] = useState<Profile | null>(null)
  const [selectedRole, setSelectedRole] = useState<'student' | 'pending_mentor' | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    nama: '',
    tanggal_lahir: '',
    gender: 'Pria' as Gender,
    interest: [] as string[],
  })
  const [newInterest, setNewInterest] = useState('')
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    async function checkUser() {
      try {
        const profile = await getCurrentUserProfile()
        if (!profile) {
          router.push('/login')
          return
        }

        if (profile.role !== 'user') {
          if (profile.role === 'pending_mentor') {
            router.push('/mentor-pending')
          } else {
            router.push('/')
          }
          return
        }

        setUser(profile)
      } catch (error) {
        console.error('Error checking user:', error)
      } finally {
        setLoading(false)
      }
    }

    checkUser()
  }, [router])

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

  const validateForm = () => {
    const errors: { [key: string]: string } = {}
    if (!formData.nama.trim()) errors.nama = 'Nama lengkap wajib diisi'
    if (!formData.gender) errors.gender = 'Jenis kelamin wajib diisi'
    if (!selectedRole) errors.role = 'Silakan pilih role Anda (Siswa atau Mentor)'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  /**
   * Alur Submit Akhir:
   * 1. Validasi input data diri dan pemilihan role.
   * 2. Simpan detail profil ke tabel 'user_profiles' (upsert).
   * 3. Update role user di tabel 'user' utama (menjadi student atau pending_mentor).
   * 4. Redirect user berdasarkan pilihan role.
   */
  async function handleFinalSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !selectedRole) return

    // Pastikan semua field wajib terisi
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setUpdating(true)

    try {
      // Step 1: Simpan data ke tabel detail profile (user_profiles)
      const { success: profileSuccess, error: profileError } = await upsertUserProfile(user.id, {
        nama: formData.nama,
        tanggal_lahir: formData.tanggal_lahir || null,
        gender: formData.gender,
        interest: JSON.stringify(formData.interest),
        avatar_url: null
      })

      if (!profileSuccess) throw new Error('Gagal menyimpan profil: ' + profileError)

      // Step 2: Perbarui role di tabel user utama
      const { success: roleSuccess, error: roleError } = await updateProfile({ role: selectedRole })

      if (!roleSuccess) throw new Error('Gagal memperbarui role: ' + roleError)

      // Step 3: Redirect sesuai pilihan
      if (selectedRole === 'student') {
        router.push('/')
      } else {
        router.push('/mentor-pending')
      }

    } catch (error: any) {
      console.error('Error during onboarding:', error)
      alert(error.message || 'Terjadi kesalahan saat pendaftaran')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Lengkapi Profil Anda
          </h1>
          <p className="mt-4 text-lg text-gray-700 font-medium">
            Selamat datang! Silakan lengkapi data diri Anda untuk memulai.
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-8" onSubmit={handleFinalSubmit}>

            <div className="space-y-6">
              <h3 className="text-xl font-bold border-b pb-2 text-gray-900">Data Diri</h3>

              <div>
                <label htmlFor="nama" className="block text-sm font-bold text-gray-900">
                  Nama Lengkap <span className="text-red-600">*</span>
                </label>
                <div className="mt-1">
                  <input
                    id="nama"
                    type="text"
                    required
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className={`appearance-none block w-full px-3 py-2 border ${formErrors.nama ? 'border-red-300' : 'border-gray-400'} rounded-md shadow-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-medium`}
                  />
                  {formErrors.nama && <p className="mt-1 text-sm text-red-600 font-semibold">{formErrors.nama}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-bold text-gray-900">
                  Jenis Kelamin <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <select
                    id="gender"
                    required
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-gray-900 font-medium"
                  >
                    <option value="Pria">Pria</option>
                    <option value="Wanita">Wanita</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="tanggal_lahir" className="block text-sm font-bold text-gray-900">
                  Tanggal Lahir
                </label>
                <div className="mt-1">
                  <input
                    id="tanggal_lahir"
                    type="date"
                    value={formData.tanggal_lahir}
                    onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900">
                  Minat / Keahlian (Contoh: Matematika, Coding, Musik)
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInterest())}
                    className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-400 text-gray-900 font-medium placeholder-gray-500"
                    placeholder="Tambah minat..."
                  />
                  <button
                    type="button"
                    onClick={handleAddInterest}
                    className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    Tambah
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.interest.map((item, idx) => (
                    <span key={idx} className="inline-flex rounded-full items-center py-0.5 pl-2.5 pr-1 text-sm font-medium bg-indigo-100 text-indigo-700">
                      {item}
                      <button
                        type="button"
                        onClick={() => handleRemoveInterest(item)}
                        className="flex-shrink-0 ml-0.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500 focus:outline-none focus:bg-indigo-500 focus:text-white"
                      >
                        <span className="sr-only">Hapus {item}</span>
                        <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                          <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-4">
              <h3 className="text-lg font-medium border-b pb-2 text-gray-900">Pilih Role Anda</h3>
              {formErrors.role && <p className="text-sm text-red-600 font-medium">{formErrors.role}</p>}

              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('student')}
                  className={`relative group p-6 rounded-xl border-2 transition-all duration-200 text-left focus:outline-none ${selectedRole === 'student' ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500' : 'border-gray-200 hover:border-blue-400'}`}
                >
                  <div className="flex items-center mb-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-4 ${selectedRole === 'student' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h4 className={`text-lg font-bold ${selectedRole === 'student' ? 'text-blue-700' : 'text-gray-900'}`}>Siswa</h4>
                  </div>
                  <p className="text-sm text-gray-800 font-medium">Saya ingin belajar, bermain games edukasi, dan meningkatkan pengetahuan.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('pending_mentor')}
                  className={`relative group p-6 rounded-xl border-2 transition-all duration-200 text-left focus:outline-none ${selectedRole === 'pending_mentor' ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-500' : 'border-gray-200 hover:border-purple-400'}`}
                >
                  <div className="flex items-center mb-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-4 ${selectedRole === 'pending_mentor' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-600'}`}>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    </div>
                    <h4 className={`text-lg font-bold ${selectedRole === 'pending_mentor' ? 'text-purple-700' : 'text-gray-900'}`}>Mentor</h4>
                  </div>
                  <p className="text-sm text-gray-800 font-medium">Saya ingin berkontribusi materi dan membimbing siswa. (Butuh persetujuan Admin)</p>
                </button>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={updating}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
              >
                {updating ? 'Memproses...' : 'Simpan & Lanjutkan'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}