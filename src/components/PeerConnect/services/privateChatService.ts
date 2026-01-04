import { supabase } from "@/lib/supabase"
import type { PrivateChatWithUser, UserProfile } from "../types"

export const loadPrivateChats = async (currentUserId: string): Promise<PrivateChatWithUser[]> => {
  try {
    const { data: chats, error } = await supabase
      .from('private_chats')
      .select('*')
      .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
      .order('last_message_at', { ascending: false })

    if (error) throw error

    if (chats && chats.length > 0) {
      const chatsWithUsers = await Promise.all(
        chats.map(async (chat) => {
          const otherUserId = chat.user1_id === currentUserId ? chat.user2_id : chat.user1_id

          const { data: profile } = await supabase
            .from('user_profiles')
            .select('user_id, nama, avatar_url')
            .eq('user_id', otherUserId)
            .single()

          const { data: user } = await supabase
            .from('user')
            .select('role')
            .eq('id', otherUserId)
            .single()

          const { data: lastMsg } = await supabase
            .from('private_messages')
            .select('message')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          return {
            ...chat,
            otherUser: {
              user_id: profile?.user_id || otherUserId,
              nama: profile?.nama || 'Unknown',
              avatar_url: profile?.avatar_url || null,
              role: user?.role
            },
            lastMessage: lastMsg?.message || 'No messages yet'
          } as PrivateChatWithUser
        })
      )

      return chatsWithUsers
    }

    return []
  } catch (error) {
    console.error('Error loading private chats:', error)
    return []
  }
}

export const findOrCreatePrivateChat = async (
  user1Id: string,
  user2Id: string
): Promise<string> => {
  const userId1 = user1Id < user2Id ? user1Id : user2Id
  const userId2 = user1Id < user2Id ? user2Id : user1Id

  const { data: existingChat } = await supabase
    .from('private_chats')
    .select('*')
    .eq('user1_id', userId1)
    .eq('user2_id', userId2)
    .single()

  if (existingChat) {
    return existingChat.id
  }

  const { data: newChat, error } = await supabase
    .from('private_chats')
    .insert({ user1_id: userId1, user2_id: userId2 })
    .select()
    .single()

  if (error) throw error
  return newChat.id
}
