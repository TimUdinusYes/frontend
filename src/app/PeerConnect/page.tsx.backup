'use client'

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import VideoCallModal from "@/components/VideoCallModal"
import {
  Sidebar,
  GroupChatArea,
  PrivateChatArea,
  LoadingScreen,
  MaterialShareModal,
  type UserProfile,
  type Interest,
  type ChatRoom,
  type ChatMessageData,
  type PrivateChatWithUser,
  type PrivateMessage,
  type ChatMode,
  type MaterialLinkData
} from "@/components/PeerConnect"

export default function PeerConnectPage() {
  const router = useRouter()

  // User & Auth States
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)

  // Categorization States
  const [loading, setLoading] = useState(false)
  const [categorizationStep, setCategorizationStep] = useState(0)
  const [detectedCategory, setDetectedCategory] = useState<string>("")

  // Chat Room States
  const [selectedInterest, setSelectedInterest] = useState<Interest | null>(null)
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null)
  const [chatMode, setChatMode] = useState<ChatMode>('group')

  // Group Chat States
  const [messages, setMessages] = useState<ChatMessageData[]>([])
  const [groupMembers, setGroupMembers] = useState<UserProfile[]>([])
  const [newMessage, setNewMessage] = useState("")

  // Private Chat States
  const [privateChats, setPrivateChats] = useState<PrivateChatWithUser[]>([])
  const [selectedPrivateChat, setSelectedPrivateChat] = useState<PrivateChatWithUser | null>(null)
  const [privateMessages, setPrivateMessages] = useState<PrivateMessage[]>([])

  // Video Call State
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false)

  // Material Share State
  const [isMaterialShareOpen, setIsMaterialShareOpen] = useState(false)
  const [materialShareMode, setMaterialShareMode] = useState<'group' | 'private'>('group')

  // ============================================
  // LIFECYCLE EFFECTS
  // ============================================

  useEffect(() => {
    loadUserProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (chatRoom) {
      loadMessages()
      const cleanup = subscribeToMessages()
      return cleanup
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatRoom?.id])

  useEffect(() => {
    if (chatRoom && chatMode === 'group') {
      loadGroupMembers()
      const cleanup = subscribeToRoomMembers()
      return cleanup
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatRoom?.id, chatMode])

  useEffect(() => {
    if (currentUser && !loading) {
      loadPrivateChats()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.user_id, loading])

  useEffect(() => {
    if (selectedPrivateChat && chatMode === 'private') {
      const cleanup = subscribeToPrivateMessages()
      return cleanup
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPrivateChat?.id, chatMode])

  // ============================================
  // USER & AUTHENTICATION
  // ============================================

  const loadUserProfile = async () => {
    try {
      setInitialLoading(true)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login?message=Silakan+login+terlebih+dahulu+untuk+menggunakan+PeerConnect')
        return
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push('/login?message=Silakan+login+terlebih+dahulu')
        return
      }

      // Load user profile
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('user_id, nama, interest, interest_id, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error || !profile) {
        router.push('/profile?message=Silakan+lengkapi+profil+Anda')
        return
      }

      if (!profile.interest || !profile.interest.trim()) {
        router.push('/profile?message=Anda+belum+mengisi+minat')
        return
      }

      // Load role from user table
      const { data: userData } = await supabase
        .from('user')
        .select('role')
        .eq('id', user.id)
        .single()

      const profileWithRole = {
        ...profile,
        role: userData?.role
      }

      setCurrentUser(profileWithRole)
      setInitialLoading(false)

      if (profile.interest_id) {
        const room = await loadChatRoomByInterestId(profile.interest_id)
        if (room) await joinRoom(profile.user_id, room)
      } else if (profile.interest && profile.interest.trim()) {
        await categorizeUserInterest(profile.interest, profile)
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      setInitialLoading(false)
      router.push('/profile?message=Terjadi+kesalahan')
    }
  }

  // ============================================
  // CHAT ROOM & CATEGORIZATION
  // ============================================

  const loadChatRoomByInterestId = async (interestId: number) => {
    try {
      const { data: room, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('interest_id', interestId)
        .single()

      if (error) throw error

      setChatRoom(room)

      const { data: interest } = await supabase
        .from('interests')
        .select('*')
        .eq('id', interestId)
        .single()

      if (interest) setSelectedInterest(interest)

      return room
    } catch (error) {
      console.error('Error loading chat room:', error)
      throw error
    }
  }

  const categorizeUserInterest = async (interestText: string, userProfile?: UserProfile) => {
    const profile = userProfile || currentUser
    if (!interestText.trim() || !profile) return

    setLoading(true)
    setCategorizationStep(1)

    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setCategorizationStep(2)

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

      const categoryName = data.category
      const categoryLabel = data.method === 'fallback'
        ? `${categoryName} (Keyword Match)`
        : `${categoryName} (AI)`

      setDetectedCategory(categoryLabel)
      setCategorizationStep(3)
      await new Promise(resolve => setTimeout(resolve, 800))

      const { data: interest, error: interestError } = await supabase
        .from('interests')
        .select('*')
        .eq('name', categoryName)
        .single()

      if (interestError) throw new Error(`Category "${data.category}" not found`)

      setSelectedInterest(interest)
      setCategorizationStep(4)
      await new Promise(resolve => setTimeout(resolve, 400))

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ interest_id: interest.id })
        .eq('user_id', profile.user_id)

      if (updateError) throw updateError

      setCurrentUser({ ...profile, interest_id: interest.id })
      await loadChatRoomByInterestId(interest.id)
      await joinRoom(profile.user_id)

      setCategorizationStep(5)
      setTimeout(() => {
        setLoading(false)
        setCategorizationStep(0)
      }, 1000)

    } catch (error: any) {
      console.error('Error categorizing interest:', error)
      setLoading(false)
      setCategorizationStep(0)
      router.push(`/profile?message=${encodeURIComponent('Gagal memproses minat')}`)
    }
  }

  const joinRoom = async (userId: string, roomParam?: ChatRoom) => {
    const room = roomParam || chatRoom
    if (!room) return

    try {
      const { error } = await supabase
        .from('room_members')
        .insert({ room_id: room.id, user_id: userId })

      if (error && error.code !== '23505') {
        console.error('Error joining room:', error)
      }

      await loadGroupMembers(room)
    } catch (error) {
      console.error('Error joining room:', error)
    }
  }

  // ============================================
  // GROUP CHAT FUNCTIONS
  // ============================================

  const loadGroupMembers = async (roomParam?: ChatRoom) => {
    const room = roomParam || chatRoom
    if (!room) return

    try {
      const { data: memberIds, error: memberError } = await supabase
        .from('room_members')
        .select('user_id')
        .eq('room_id', room.id)

      if (memberError || !memberIds || memberIds.length === 0) {
        setGroupMembers([])
        return
      }

      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_id, nama, avatar_url, interest')
        .in('user_id', memberIds.map(m => m.user_id))

      if (profileError) return

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
        setGroupMembers(profilesWithRole as UserProfile[])
      }
    } catch (error) {
      console.error('Error loading group members:', error)
    }
  }

  const subscribeToRoomMembers = () => {
    if (!chatRoom) return

    const channel = supabase
      .channel(`room-members-${chatRoom.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'room_members',
        filter: `room_id=eq.${chatRoom.id}`
      }, async () => {
        await loadGroupMembers()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const loadMessages = async () => {
    if (!chatRoom) return

    try {
      const { data: messagesData, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', chatRoom.id)
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) throw error

      const messagesWithProfiles = await Promise.all(
        (messagesData || []).map(async (msg) => {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('nama, avatar_url')
            .eq('user_id', msg.user_id)
            .single()

          const { data: user } = await supabase
            .from('user')
            .select('role')
            .eq('id', msg.user_id)
            .single()

          // Load material data if material_id exists
          let materialData = null
          if (msg.material_id) {
            const { data: material } = await supabase
              .from('materials')
              .select(`
                id,
                title,
                url,
                material_type,
                topics (title)
              `)
              .eq('id', msg.material_id)
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

          return {
            ...msg,
            material_data: materialData,
            user_profiles: profile ? {
              nama: profile.nama,
              avatar_url: profile.avatar_url,
              role: user?.role
            } : null
          }
        })
      )

      setMessages(messagesWithProfiles)
    } catch (error: any) {
      console.error('Error loading messages:', error)
    }
  }

  const subscribeToMessages = () => {
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
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !chatRoom) return

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: chatRoom.id,
          user_id: currentUser.user_id,
          message: newMessage.trim()
        })

      if (error) throw error
      setNewMessage("")
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Gagal mengirim pesan')
    }
  }

  const sendMaterialMessage = async (material: MaterialLinkData, message?: string) => {
    if (!currentUser || !chatRoom) return

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: chatRoom.id,
          user_id: currentUser.user_id,
          message: message || `📚 Shared: ${material.title}`,
          material_id: material.id
        })

      if (error) throw error
    } catch (error) {
      console.error('Error sending material:', error)
      alert('Gagal mengirim materi')
    }
  }

  // ============================================
  // PRIVATE CHAT FUNCTIONS
  // ============================================

  const loadPrivateChats = async () => {
    if (!currentUser) return

    try {
      const { data: chats, error } = await supabase
        .from('private_chats')
        .select('*')
        .or(`user1_id.eq.${currentUser.user_id},user2_id.eq.${currentUser.user_id}`)
        .order('last_message_at', { ascending: false })

      if (error) throw error

      if (chats && chats.length > 0) {
        const chatsWithUsers = await Promise.all(
          chats.map(async (chat) => {
            const otherUserId = chat.user1_id === currentUser.user_id ? chat.user2_id : chat.user1_id

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

        setPrivateChats(chatsWithUsers)
      }
    } catch (error) {
      console.error('Error loading private chats:', error)
    }
  }

  const startPrivateChat = async (otherUser: UserProfile) => {
    if (!currentUser || otherUser.user_id === currentUser.user_id) return

    try {
      const user1 = currentUser.user_id < otherUser.user_id ? currentUser.user_id : otherUser.user_id
      const user2 = currentUser.user_id < otherUser.user_id ? otherUser.user_id : currentUser.user_id

      const { data: existingChat } = await supabase
        .from('private_chats')
        .select('*')
        .eq('user1_id', user1)
        .eq('user2_id', user2)
        .single()

      let chatId: string

      if (existingChat) {
        chatId = existingChat.id
      } else {
        const { data: newChat, error } = await supabase
          .from('private_chats')
          .insert({ user1_id: user1, user2_id: user2 })
          .select()
          .single()

        if (error) throw error
        chatId = newChat.id
      }

      const chatWithUser: PrivateChatWithUser = {
        id: chatId,
        user1_id: user1,
        user2_id: user2,
        created_at: existingChat?.created_at || new Date().toISOString(),
        last_message_at: existingChat?.last_message_at || new Date().toISOString(),
        otherUser: {
          user_id: otherUser.user_id,
          nama: otherUser.nama,
          avatar_url: otherUser.avatar_url,
          role: otherUser.role
        },
        lastMessage: 'Start chatting!'
      }

      setSelectedPrivateChat(chatWithUser)
      setChatMode('private')
      await loadPrivateMessages(chatId)
      await loadPrivateChats()
    } catch (error) {
      console.error('Error starting private chat:', error)
      alert('Gagal memulai private chat')
    }
  }

  const loadPrivateMessages = async (chatId: string) => {
    try {
      const { data: msgs, error } = await supabase
        .from('private_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

      if (error) throw error

      const messagesWithProfiles = await Promise.all(
        (msgs || []).map(async (msg) => {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('nama, avatar_url')
            .eq('user_id', msg.sender_id)
            .single()

          // Load material data if material_id exists
          let materialData = null
          if (msg.material_id) {
            const { data: material } = await supabase
              .from('materials')
              .select(`
                id,
                title,
                url,
                material_type,
                topics (title)
              `)
              .eq('id', msg.material_id)
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

          return {
            ...msg,
            user_profiles: profile,
            material_data: materialData
          }
        })
      )

      setPrivateMessages(messagesWithProfiles)
    } catch (error) {
      console.error('Error loading private messages:', error)
    }
  }

  const sendPrivateMessage = async () => {
    if (!newMessage.trim() || !currentUser || !selectedPrivateChat) return

    try {
      const { error } = await supabase
        .from('private_messages')
        .insert({
          chat_id: selectedPrivateChat.id,
          sender_id: currentUser.user_id,
          message: newMessage.trim()
        })

      if (error) throw error
      setNewMessage("")
    } catch (error) {
      console.error('Error sending private message:', error)
      alert('Gagal mengirim pesan')
    }
  }

  const sendPrivateMaterialMessage = async (material: MaterialLinkData, message?: string) => {
    if (!currentUser || !selectedPrivateChat) return

    try {
      const { error } = await supabase
        .from('private_messages')
        .insert({
          chat_id: selectedPrivateChat.id,
          sender_id: currentUser.user_id,
          message: message || `📚 Shared: ${material.title}`,
          material_id: material.id
        })

      if (error) throw error
    } catch (error) {
      console.error('Error sending material:', error)
      alert('Gagal mengirim materi')
    }
  }

  const subscribeToPrivateMessages = () => {
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
  }

  const handleSelectPrivateChat = async (chat: PrivateChatWithUser) => {
    setSelectedPrivateChat(chat)
    await loadPrivateMessages(chat.id)
  }

  // ============================================
  // RENDER
  // ============================================

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (loading || !chatRoom) {
    return (
      <LoadingScreen
        categorizationStep={categorizationStep}
        detectedCategory={detectedCategory}
        userInterest={currentUser.interest || ''}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Top Header Bar */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4">
        <div className="max-w-full mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Home
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">PeerConnect</h1>
          </div>
          <Link
            href="/profile"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Sidebar */}
        <Sidebar
          currentUser={currentUser}
          chatMode={chatMode}
          chatRoom={chatRoom}
          selectedInterest={selectedInterest}
          groupMembers={groupMembers}
          privateChats={privateChats}
          selectedPrivateChatId={selectedPrivateChat?.id || null}
          onChatModeChange={setChatMode}
          onStartPrivateChat={startPrivateChat}
          onSelectPrivateChat={handleSelectPrivateChat}
        />

        {/* Right Side - Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
          {chatMode === 'group' && chatRoom ? (
            <GroupChatArea
              chatRoom={chatRoom}
              messages={messages}
              groupMembers={groupMembers}
              currentUserId={currentUser.user_id}
              currentUserRole={currentUser.role}
              newMessage={newMessage}
              onNewMessageChange={setNewMessage}
              onSendMessage={sendMessage}
              onSendMaterialLink={sendMaterialMessage}
              onStartPrivateChat={startPrivateChat}
              onOpenMaterialShare={() => {
                setMaterialShareMode('group')
                setIsMaterialShareOpen(true)
              }}
            />
          ) : chatMode === 'private' && selectedPrivateChat ? (
            <PrivateChatArea
              selectedChat={selectedPrivateChat}
              messages={privateMessages}
              currentUserId={currentUser.user_id}
              currentUserRole={currentUser.role}
              newMessage={newMessage}
              onNewMessageChange={setNewMessage}
              onSendMessage={sendPrivateMessage}
              onSendMaterialLink={sendPrivateMaterialMessage}
              onBack={() => setSelectedPrivateChat(null)}
              onVideoCall={() => setIsVideoCallOpen(true)}
              onOpenMaterialShare={() => {
                setMaterialShareMode('private')
                setIsMaterialShareOpen(true)
              }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <svg className="w-24 h-24 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="text-lg font-semibold mb-2">Select a chat to start messaging</h3>
                <p className="text-sm">Choose from your {chatMode === 'group' ? 'group members' : 'private conversations'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Video Call Modal */}
      {selectedPrivateChat && (
        <VideoCallModal
          isOpen={isVideoCallOpen}
          onClose={() => setIsVideoCallOpen(false)}
          roomName={`peerconnect-${selectedPrivateChat.id}`}
          displayName={currentUser.nama}
        />
      )}

      {/* Material Share Modal */}
      <MaterialShareModal
        isOpen={isMaterialShareOpen}
        onClose={() => setIsMaterialShareOpen(false)}
        onSelectMaterial={materialShareMode === 'group' ? sendMaterialMessage : sendPrivateMaterialMessage}
        currentUserId={currentUser.user_id}
      />
    </div>
  )
}
