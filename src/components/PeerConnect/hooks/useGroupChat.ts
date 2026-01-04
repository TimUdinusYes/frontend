import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { ChatRoom, ChatMessageData, UserProfile, MaterialLinkData } from "../types"
import {
  loadChatMessages,
  sendChatMessage,
  sendChatMaterialMessage
} from "../services/messageService"
import { loadGroupMembers } from "../services/chatService"

export const useGroupChat = (chatRoom: ChatRoom | null, currentUser: UserProfile | null) => {
  const [messages, setMessages] = useState<ChatMessageData[]>([])
  const [groupMembers, setGroupMembers] = useState<UserProfile[]>([])
  const [newMessage, setNewMessage] = useState("")

  const loadMessages = useCallback(async () => {
    if (!chatRoom) return

    try {
      const messagesData = await loadChatMessages(chatRoom.id)
      setMessages(messagesData)
    } catch (error: any) {
      console.error('Error loading messages:', error)
    }
  }, [chatRoom])

  const subscribeToMessages = useCallback(() => {
    if (!chatRoom) return

    const channel = supabase
      .channel(`chat-${chatRoom.id}`, {
        config: {
          broadcast: { self: true },
          presence: { key: currentUser?.user_id }
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${chatRoom.id}`
      }, async (payload) => {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('nama, avatar_url')
          .eq('user_id', payload.new.user_id)
          .single()

        const { data: user } = await supabase
          .from('user')
          .select('role')
          .eq('id', payload.new.user_id)
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
          material_data: materialData,
          user_profiles: profile ? {
            nama: profile.nama,
            avatar_url: profile.avatar_url,
            role: user?.role
          } : null
        } as ChatMessageData

        setMessages((prev) => [...prev, newMsg])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chatRoom, currentUser])

  const subscribeToRoomMembers = useCallback(() => {
    if (!chatRoom) return

    const channel = supabase
      .channel(`room-members-${chatRoom.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'room_members',
        filter: `room_id=eq.${chatRoom.id}`
      }, async () => {
        const members = await loadGroupMembers(chatRoom.id)
        setGroupMembers(members)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chatRoom])

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !chatRoom) return

    try {
      await sendChatMessage(chatRoom.id, currentUser.user_id, newMessage.trim())
      setNewMessage("")
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Gagal mengirim pesan')
    }
  }

  const sendMaterialMessage = async (material: MaterialLinkData, message?: string) => {
    if (!currentUser || !chatRoom) return

    try {
      await sendChatMaterialMessage(chatRoom.id, currentUser.user_id, material, message)
    } catch (error) {
      console.error('Error sending material:', error)
      alert('Gagal mengirim materi')
    }
  }

  const loadMembers = useCallback(async () => {
    if (!chatRoom) return

    const members = await loadGroupMembers(chatRoom.id)
    setGroupMembers(members)
  }, [chatRoom])

  useEffect(() => {
    if (chatRoom) {
      loadMessages()
      const cleanup = subscribeToMessages()
      return cleanup
    }
  }, [chatRoom?.id, loadMessages, subscribeToMessages])

  useEffect(() => {
    if (chatRoom) {
      loadMembers()
      const cleanup = subscribeToRoomMembers()
      return cleanup
    }
  }, [chatRoom?.id, loadMembers, subscribeToRoomMembers])

  return {
    messages,
    groupMembers,
    newMessage,
    setNewMessage,
    sendMessage,
    sendMaterialMessage,
    loadMessages
  }
}
