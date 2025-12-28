import { supabase } from './supabase'
import type { Profile } from '@/types/database'

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

export async function approveMentor(userId: string) {
  return updateUserRole(userId, 'mentor')
}

export async function rejectMentor(userId: string) {
  return updateUserRole(userId, 'user')
}
