import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { PrivateChatWithUser, PrivateMessage, UserProfile, MaterialLinkData } from "../types"
import {
  loadPrivateMessages,
  sendPrivateMessage,
  sendPrivateMaterialMessage
} from "../services/messageService"
import { loadPrivateChats, findOrCreatePrivateChat } from "../services/privateChatService"

export const usePrivateChat = (currentUser: UserProfile | null, loading: boolean) => {
  const [privateChats, setPrivateChats] = useState<PrivateChatWithUser[]>([])
  const [selectedPrivateChat, setSelectedPrivateChat] = useState<PrivateChatWithUser | null>(null)
  const [privateMessages, setPrivateMessages] = useState<PrivateMessage[]>([])

  const loadChats = useCallback(async () => {
    if (!currentUser) return

    try {
      const chats = await loadPrivateChats(currentUser.user_id)
      setPrivateChats(chats)
    } catch (error) {
      console.error('Error loading private chats:', error)
    }
  }, [currentUser])

  const startPrivateChat = async (otherUser: UserProfile) => {
    if (!currentUser || otherUser.user_id === currentUser.user_id) return

    try {
      const chatId = await findOrCreatePrivateChat(currentUser.user_id, otherUser.user_id)

      const chatWithUser: PrivateChatWithUser = {
        id: chatId,
        user1_id: currentUser.user_id < otherUser.user_id ? currentUser.user_id : otherUser.user_id,
        user2_id: currentUser.user_id < otherUser.user_id ? otherUser.user_id : currentUser.user_id,
        created_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
        otherUser: {
          user_id: otherUser.user_id,
          nama: otherUser.nama,
          avatar_url: otherUser.avatar_url,
          role: otherUser.role
        },
        lastMessage: 'Start chatting!'
      }

      setSelectedPrivateChat(chatWithUser)
      await loadMessages(chatId)
      await loadChats()
    } catch (error) {
      console.error('Error starting private chat:', error)
      alert('Gagal memulai private chat')
    }
  }

  const loadMessages = useCallback(async (chatId: string) => {
    try {
      const msgs = await loadPrivateMessages(chatId)
      setPrivateMessages(msgs)
    } catch (error) {
      console.error('Error loading private messages:', error)
    }
  }, [])

  const subscribeToPrivateMessages = useCallback(() => {
    if (!selectedPrivateChat) return

    const channel = supabase
      .channel(`private-chat-${selectedPrivateChat.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'private_messages',
        filter: `chat_id=eq.${selectedPrivateChat.id}`
      }, async (payload) => {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('nama, avatar_url')
          .eq('user_id', payload.new.sender_id)
          .single()

        // Load material data if material_id exists
        let materialData = null
        if (payload.new.material_id) {
          const { data: material } = await supabase
            .from('materials')
            .select(`
              id,
              title,
              url,
              material_type,
              topics (title)
            `)
            .eq('id', payload.new.material_id)
            .single()

          if (material) {
            materialData = {
              id: material.id,
              title: material.title,
              slug: (material as any).url,
              material_type: material.material_type,
              topic: (material as any).topics?.title
            }
          }
        }

        const newMsg = {
          ...payload.new,
          user_profiles: profile,
          material_data: materialData
        } as PrivateMessage

        setPrivateMessages((prev) => [...prev, newMsg])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedPrivateChat])

  const handleSelectPrivateChat = async (chat: PrivateChatWithUser) => {
    setSelectedPrivateChat(chat)
    await loadMessages(chat.id)
  }

  const sendMessage = async (message: string) => {
    if (!message.trim() || !currentUser || !selectedPrivateChat) return

    try {
      await sendPrivateMessage(selectedPrivateChat.id, currentUser.user_id, message.trim())
    } catch (error) {
      console.error('Error sending private message:', error)
      alert('Gagal mengirim pesan')
    }
  }

  const sendMaterialMessage = async (material: MaterialLinkData, message?: string) => {
    if (!currentUser || !selectedPrivateChat) return

    try {
      await sendPrivateMaterialMessage(selectedPrivateChat.id, currentUser.user_id, material, message)
    } catch (error) {
      console.error('Error sending material:', error)
      alert('Gagal mengirim materi')
    }
  }

  useEffect(() => {
    if (currentUser && !loading) {
      loadChats()
    }
  }, [currentUser?.user_id, loading, loadChats])

  useEffect(() => {
    if (selectedPrivateChat) {
      const cleanup = subscribeToPrivateMessages()
      return cleanup
    }
  }, [selectedPrivateChat?.id, subscribeToPrivateMessages])

  return {
    privateChats,
    selectedPrivateChat,
    privateMessages,
    startPrivateChat,
    handleSelectPrivateChat,
    sendMessage,
    sendMaterialMessage,
    setSelectedPrivateChat
  }
}
