import { supabase } from "@/lib/supabase"
import type { ChatMessageData, PrivateMessage, MaterialLinkData, UserProfile } from "../types"

export const loadMaterialData = async (materialId: number): Promise<MaterialLinkData | null> => {
  try {
    const { data: material } = await supabase
      .from('materials')
      .select(`
        id,
        title,
        url,
        material_type,
        topics (title)
      `)
      .eq('id', materialId)
      .single()

    if (material) {
      return {
        id: material.id,
        title: material.title,
        slug: (material as any).url,
        material_type: material.material_type,
        topic: (material as any).topics?.title
      }
    }
    return null
  } catch (error) {
    console.error('Error loading material data:', error)
    return null
  }
}

export const loadUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('nama, avatar_url')
      .eq('user_id', userId)
      .single()

    const { data: user } = await supabase
      .from('user')
      .select('role')
      .eq('id', userId)
      .single()

    if (profile) {
      return {
        user_id: userId,
        nama: profile.nama,
        avatar_url: profile.avatar_url,
        interest: null,
        interest_id: null,
        role: user?.role
      }
    }
    return null
  } catch (error) {
    console.error('Error loading user profile:', error)
    return null
  }
}

export const loadChatMessages = async (roomId: string): Promise<ChatMessageData[]> => {
  try {
    const { data: messagesData, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(100)

    if (error) throw error

    const messagesWithProfiles = await Promise.all(
      (messagesData || []).map(async (msg) => {
        const profile = await loadUserProfile(msg.user_id)
        const materialData = msg.material_id ? await loadMaterialData(msg.material_id) : null

        return {
          ...msg,
          material_data: materialData,
          user_profiles: profile
        }
      })
    )

    return messagesWithProfiles
  } catch (error: any) {
    console.error('Error loading messages:', error)
    return []
  }
}

export const loadPrivateMessages = async (chatId: string): Promise<PrivateMessage[]> => {
  try {
    const { data: msgs, error } = await supabase
      .from('private_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })

    if (error) throw error

    const messagesWithProfiles = await Promise.all(
      (msgs || []).map(async (msg) => {
        const profile = await loadUserProfile(msg.sender_id)
        const materialData = msg.material_id ? await loadMaterialData(msg.material_id) : null

        return {
          ...msg,
          user_profiles: profile,
          material_data: materialData
        }
      })
    )

    return messagesWithProfiles
  } catch (error) {
    console.error('Error loading private messages:', error)
    return []
  }
}

export const sendChatMessage = async (roomId: string, userId: string, message: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        user_id: userId,
        message: message.trim()
      })

    if (error) throw error
  } catch (error) {
    console.error('Error sending message:', error)
    throw error
  }
}

export const sendChatMaterialMessage = async (
  roomId: string,
  userId: string,
  material: MaterialLinkData,
  message?: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        user_id: userId,
        message: message || `📚 Shared: ${material.title}`,
        material_id: material.id
      })

    if (error) throw error
  } catch (error) {
    console.error('Error sending material:', error)
    throw error
  }
}

export const sendPrivateMessage = async (chatId: string, senderId: string, message: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('private_messages')
      .insert({
        chat_id: chatId,
        sender_id: senderId,
        message: message.trim()
      })

    if (error) throw error
  } catch (error) {
    console.error('Error sending private message:', error)
    throw error
  }
}

export const sendPrivateMaterialMessage = async (
  chatId: string,
  senderId: string,
  material: MaterialLinkData,
  message?: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('private_messages')
      .insert({
        chat_id: chatId,
        sender_id: senderId,
        message: message || `📚 Shared: ${material.title}`,
        material_id: material.id
      })

    if (error) throw error
  } catch (error) {
    console.error('Error sending material:', error)
    throw error
  }
}
