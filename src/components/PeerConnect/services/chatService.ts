import { supabase } from "@/lib/supabase"
import type { ChatRoom, Interest, UserProfile } from "../types"

export const loadChatRoomByInterestId = async (interestId: number): Promise<ChatRoom | null> => {
  try {
    const { data: room, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('interest_id', interestId)
      .single()

    if (error) throw error
    return room
  } catch (error) {
    console.error('Error loading chat room:', error)
    throw error
  }
}

export const loadInterestById = async (interestId: number): Promise<Interest | null> => {
  try {
    const { data: interest, error } = await supabase
      .from('interests')
      .select('*')
      .eq('id', interestId)
      .single()

    if (error) throw error
    return interest
  } catch (error) {
    console.error('Error loading interest:', error)
    return null
  }
}

export const joinRoom = async (userId: string, roomId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('room_members')
      .insert({ room_id: roomId, user_id: userId })

    if (error && error.code !== '23505') {
      console.error('Error joining room:', error)
    }
  } catch (error) {
    console.error('Error joining room:', error)
  }
}

export const loadGroupMembers = async (roomId: string): Promise<UserProfile[]> => {
  try {
    const { data: memberIds, error: memberError } = await supabase
      .from('room_members')
      .select('user_id')
      .eq('room_id', roomId)

    if (memberError || !memberIds || memberIds.length === 0) {
      return []
    }

    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, nama, avatar_url, interest')
      .in('user_id', memberIds.map(m => m.user_id))

    if (profileError) return []

    const userIds = profiles?.map(p => p.user_id) || []
    const { data: users } = await supabase
      .from('user')
      .select('id, role')
      .in('id', userIds)

    if (profiles) {
      const profilesWithRole = profiles.map(profile => {
        const userRole = users?.find(u => u.id === profile.user_id)
        return {
          user_id: profile.user_id,
          nama: profile.nama,
          avatar_url: profile.avatar_url,
          interest: profile.interest,
          interest_id: null,
          role: userRole?.role
        }
      })
      return profilesWithRole as UserProfile[]
    }

    return []
  } catch (error) {
    console.error('Error loading group members:', error)
    return []
  }
}

export const categorizeUserInterest = async (interestText: string): Promise<string> => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  const response = await fetch('/api/AI/categorize-interest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userInput: interestText }),
    signal: controller.signal
  })

  clearTimeout(timeoutId)

  if (!response.ok) throw new Error(`API returned ${response.status}`)

  const data = await response.json()
  if (!data.success || !data.category) throw new Error('AI failed')

  return data.category
}

export const findInterestByName = async (categoryName: string): Promise<Interest | null> => {
  try {
    const { data: interest, error } = await supabase
      .from('interests')
      .select('*')
      .eq('name', categoryName)
      .single()

    if (error) throw new Error(`Category "${categoryName}" not found`)
    return interest
  } catch (error) {
    console.error('Error finding interest:', error)
    return null
  }
}

export const updateUserInterestId = async (userId: string, interestId: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ interest_id: interestId })
      .eq('user_id', userId)

    if (error) throw error
  } catch (error) {
    console.error('Error updating user interest:', error)
    throw error
  }
}
