import { supabase } from './supabase'
import type { Profile } from '@/types/database'

/**
 * Mengambil semua daftar user dari tabel "user".
 * Digunakan untuk menampilkan tabel manajemen user di Dashboard Admin.
 */
export async function getAllUsers() {
  const { data, error } = await supabase
    .from('user')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching all users:', error)
    return []
  }

  return data as Profile[]
}

/**
 * Mengambil daftar user yang baru saja mendaftar sebagai mentor
 * dan masih berstatus 'pending_mentor'.
 */
export async function getPendingMentors() {
  const { data, error } = await supabase
    .from('user')
    .select('*')
    .eq('role', 'pending_mentor')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching pending mentors:', error)
    return []
  }

  return data as Profile[]
}

/**
 * Fungsi umum untuk memperbarui role user berdasarkan ID.
 */
export async function updateUserRole(userId: string, newRole: string) {
  const { error } = await supabase
    .from('user')
    .update({ role: newRole })
    .eq('id', userId)

  if (error) {
    console.error('Error updating user role:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Alur Approve: Mengubah status user dari 'pending_mentor' menjadi 'mentor' resmi.
 */
export async function approveMentor(userId: string) {
  return updateUserRole(userId, 'mentor')
}

/**
 * Alur Reject: Mengembalikan status mentor yang ditolak menjadi user biasa.
 */
export async function rejectMentor(userId: string) {
  return updateUserRole(userId, 'user')
}
