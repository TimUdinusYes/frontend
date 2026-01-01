'use client'

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { PrivateChat, PrivateMessage } from "@/types/database"
import VideoCallModal from "@/components/VideoCallModal"

interface Interest {
  id: number
  name: string
  description: string
}

interface ChatRoom {
  id: string
  interest_id: number
  name: string
  created_at: string
}

interface ChatMessage {
  id: string
  room_id: string
  user_id: string
  message: string
  created_at: string
  user_profiles?: {
    nama: string
    avatar_url: string
  }
}

interface UserProfile {
  user_id: string
  nama: string
  interest: string | null
  interest_id: number | null
  avatar_url: string
}

interface PrivateChatWithUser extends PrivateChat {
  otherUser: {
    user_id: string
    nama: string
    avatar_url: string | null
  }
  lastMessage?: string
}

type ChatMode = 'group' | 'private'

export default function PeerConnectPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [selectedInterest, setSelectedInterest] = useState<Interest | null>(null)
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [categorizationStep, setCategorizationStep] = useState(0)
  const [detectedCategory, setDetectedCategory] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Private Chat States
  const [chatMode, setChatMode] = useState<ChatMode>('group')
  const [privateChats, setPrivateChats] = useState<PrivateChatWithUser[]>([])
  const [selectedPrivateChat, setSelectedPrivateChat] = useState<PrivateChatWithUser | null>(null)
  const [privateMessages, setPrivateMessages] = useState<PrivateMessage[]>([])
  const [groupMembers, setGroupMembers] = useState<UserProfile[]>([])

  // Video Call State
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false)

  // Load user profile saat pertama kali
  useEffect(() => {
    loadUserProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load messages saat chat room berubah
  useEffect(() => {
    if (chatRoom) {
      loadMessages()
      const cleanup = subscribeToMessages()
      return cleanup
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatRoom?.id])

  // Auto scroll ke bawah saat ada pesan baru
  useEffect(() => {
    scrollToBottom()
  }, [messages, privateMessages])

  // Load group members saat chat room berubah
  useEffect(() => {
    if (chatRoom && chatMode === 'group') {
      loadGroupMembers()
      const cleanup = subscribeToRoomMembers()
      return cleanup
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatRoom?.id, chatMode])

  // Load private chats saat currentUser tersedia
  useEffect(() => {
    if (currentUser && !loading) {
      loadPrivateChats()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.user_id, loading])

  // Subscribe to private messages
  useEffect(() => {
    if (selectedPrivateChat && chatMode === 'private') {
      const cleanup = subscribeToPrivateMessages()
      return cleanup
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPrivateChat?.id, chatMode])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadUserProfile = async () => {
    try {
      setInitialLoading(true)

      // Check session first to avoid AuthSessionMissingError
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        console.log('No session found')
        setInitialLoading(false)
        // Redirect ke halaman login
        setTimeout(() => {
          router.push('/login?message=Silakan+login+terlebih+dahulu+untuk+menggunakan+PeerConnect')
        }, 100)
        return
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError) {
        console.error('Auth error:', userError)
        setInitialLoading(false)
        // Redirect ke halaman login jika error auth
        setTimeout(() => {
          router.push('/login?message=Terjadi+kesalahan+autentikasi.+Silakan+login+kembali')
        }, 100)
        return
      }

      if (!user) {
        console.log('No user logged in')
        setInitialLoading(false)
        // Redirect ke halaman login
        setTimeout(() => {
          router.push('/login?message=Silakan+login+terlebih+dahulu+untuk+menggunakan+PeerConnect')
        }, 100)
        return
      }

      console.log('User ID:', user.id)

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('user_id, nama, interest, interest_id, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Profile query error:', error)
        setInitialLoading(false)
        // Redirect ke profile jika error load profile
        setTimeout(() => {
          router.push('/profile?message=Tidak+dapat+memuat+profil.+Silakan+lengkapi+profil+Anda')
        }, 100)
        return
      }

      if (!profile) {
        console.log('No profile found for user')
        setInitialLoading(false)
        // Redirect ke halaman profile
        setTimeout(() => {
          router.push('/profile?message=Silakan+lengkapi+profil+dan+minat+Anda+terlebih+dahulu+untuk+menggunakan+PeerConnect')
        }, 100)
        return
      }

      console.log('Profile loaded:', profile)

      // Jika user belum punya interest di profile
      if (!profile.interest || !profile.interest.trim()) {
        setInitialLoading(false)
        // Redirect ke profile jika belum isi interest
        setTimeout(() => {
          router.push('/profile?message=Anda+belum+mengisi+minat+di+profil.+Silakan+lengkapi+terlebih+dahulu')
        }, 100)
        return
      }

      // Set currentUser SEBELUM kategorisasi
      setCurrentUser(profile)
      setInitialLoading(false) // Set false di sini agar UI bisa update

      // Jika user sudah punya interest_id, langsung load chat room
      if (profile.interest_id) {
        const room = await loadChatRoomByInterestId(profile.interest_id)
        // Auto join room jika belum join
        if (room) {
          await joinRoom(profile.user_id, room)
        }
      }
      // Jika user punya interest (text) tapi belum dikategorikan
      else if (profile.interest && profile.interest.trim()) {
        // Auto-kategorikan dengan AI (pass profile langsung)
        console.log('Starting categorization for:', profile.interest)
        await categorizeUserInterest(profile.interest, profile)
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      setInitialLoading(false)
      // Redirect ke profile jika terjadi error
      setTimeout(() => {
        router.push('/profile?message=Terjadi+kesalahan+memuat+data.+Silakan+coba+lagi')
      }, 100)
    }
  }

  const loadChatRoomByInterestId = async (interestId: number) => {
    try {
      console.log('Loading chat room for interest_id:', interestId)
      const { data: room, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('interest_id', interestId)
        .single()

      if (error) throw error

      console.log('✅ Chat room loaded:', room)
      setChatRoom(room)

      // Load interest info
      const { data: interest } = await supabase
        .from('interests')
        .select('*')
        .eq('id', interestId)
        .single()

      if (interest) {
        console.log('✅ Interest loaded:', interest.name)
        setSelectedInterest(interest)
      }

      return room
    } catch (error) {
      console.error('Error loading chat room:', error)
      throw error
    }
  }

  const categorizeUserInterest = async (interestText: string, userProfile?: UserProfile) => {
    const profile = userProfile || currentUser
    if (!interestText.trim() || !profile) {
      console.error('Missing data - interestText:', interestText, 'profile:', profile)
      return
    }

    setLoading(true)
    setCategorizationStep(1) // Step 1: Analyzing

    try {
      // Step 1: Analyzing interest
      await new Promise(resolve => setTimeout(resolve, 500))

      setCategorizationStep(2) // Step 2: Sending to AI

      console.log('Sending to AI:', interestText)

      // Kirim ke AI untuk kategorisasi dengan timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

      const response = await fetch('/api/AI/categorize-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: interestText }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', errorText)
        throw new Error(`API returned ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log('AI Response:', data)

      if (!data.success || !data.category) {
        throw new Error('AI failed to categorize interest')
      }

      const categoryName = data.category
      const categoryLabel = data.method === 'fallback'
        ? `${categoryName} (Keyword Match)`
        : `${categoryName} (AI)`

      setDetectedCategory(categoryLabel)
      setCategorizationStep(3) // Step 3: Category detected
      await new Promise(resolve => setTimeout(resolve, 800))

      // Cari interest berdasarkan kategori (gunakan categoryName, bukan categoryLabel)
      const { data: interest, error: interestError } = await supabase
        .from('interests')
        .select('*')
        .eq('name', categoryName)
        .single()

      if (interestError) {
        console.error('Interest lookup error:', interestError)
        throw new Error(`Category "${data.category}" not found in database`)
      }

      setSelectedInterest(interest)

      setCategorizationStep(4) // Step 4: Joining room
      await new Promise(resolve => setTimeout(resolve, 400))

      // Update user profile dengan interest_id
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ interest_id: interest.id })
        .eq('user_id', profile.user_id)

      if (updateError) {
        console.error('Profile update error:', updateError)
        throw updateError
      }

      // Update currentUser state
      setCurrentUser({ ...profile, interest_id: interest.id })

      // Load chat room untuk interest ini
      await loadChatRoomByInterestId(interest.id)

      // Auto join room
      await joinRoom(profile.user_id)

      setCategorizationStep(5) // Complete

      console.log('✅ Categorization complete, resetting loading states...')

      // IMPORTANT: Reset loading states setelah selesai
      // Menggunakan delay lebih lama untuk memastikan state chatRoom sudah ter-update
      setTimeout(() => {
        console.log('Resetting loading to false')
        setLoading(false)
        setCategorizationStep(0)
      }, 1000) // Delay 1 detik agar user bisa lihat "Berhasil!" dan state chatRoom sudah ter-update

    } catch (error: any) {
      console.error('Error categorizing interest:', error)

      let errorMessage = 'Gagal memproses minat. '

      if (error.name === 'AbortError') {
        errorMessage += 'Request timeout. Silakan coba lagi.'
      } else if (error.message?.includes('API returned')) {
        errorMessage += 'Terjadi kesalahan API.'
      } else if (error.message?.includes('not found')) {
        errorMessage += error.message
      } else {
        errorMessage += 'Silakan coba lagi.'
      }

      console.error('Categorization error:', errorMessage)
      setLoading(false)
      setCategorizationStep(0)

      // Redirect ke profile dengan error message
      setTimeout(() => {
        router.push(`/profile?message=${encodeURIComponent(errorMessage)}`)
      }, 100)
    }
  }

  const joinRoom = async (userId: string, roomParam?: ChatRoom) => {
    const room = roomParam || chatRoom

    if (!room) {
      console.log('joinRoom: No room provided')
      return
    }

    try {
      console.log('Joining room:', room.id, 'for user:', userId)

      const { error } = await supabase
        .from('room_members')
        .insert({
          room_id: room.id,
          user_id: userId
        })

      if (error) {
        if (error.code === '23505') {
          console.log('User already in room (duplicate)')
        } else {
          console.error('Error joining room:', error)
        }
      } else {
        console.log('✅ Successfully joined room')
      }

      // Reload members setelah join, pass room parameter
      await loadGroupMembers(room)
    } catch (error) {
      console.error('Error joining room:', error)
    }
  }

  const loadMessages = async () => {
    if (!chatRoom) return

    try {
      console.log('Loading messages for room:', chatRoom.id)

      // Load messages
      const { data: messagesData, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', chatRoom.id)
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) {
        console.error('Supabase error details:', error)
        throw error
      }

      // Load user profiles for each message
      const messagesWithProfiles = await Promise.all(
        (messagesData || []).map(async (msg) => {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('nama, avatar_url')
            .eq('user_id', msg.user_id)
            .single()

          return {
            ...msg,
            user_profiles: profile
          }
        })
      )

      console.log('Messages loaded:', messagesWithProfiles)
      setMessages(messagesWithProfiles)
    } catch (error: any) {
      console.error('Error loading messages:', error)
      console.error('Error message:', error?.message)
      console.error('Error details:', error?.details)
      console.error('Error hint:', error?.hint)
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
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${chatRoom.id}`
        },
        async (payload) => {
          // Load user profile untuk pesan baru
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('nama, avatar_url')
            .eq('user_id', payload.new.user_id)
            .single()

          const newMsg = {
            ...payload.new,
            user_profiles: profile
          } as ChatMessage

          setMessages((prev) => [...prev, newMsg])
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime subscription active with RLS')
        }
      })

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
      alert('Gagal mengirim pesan. Silakan coba lagi.')
    }
  }

  // ============================================
  // PRIVATE CHAT FUNCTIONS
  // ============================================

  const loadGroupMembers = async (roomParam?: ChatRoom) => {
    const room = roomParam || chatRoom

    if (!room) {
      console.log('loadGroupMembers: No room provided')
      return
    }

    try {
      console.log('Loading group members for room:', room.id)

      const { data: memberIds, error: memberError } = await supabase
        .from('room_members')
        .select('user_id')
        .eq('room_id', room.id)

      if (memberError) {
        console.error('Error fetching room_members:', memberError)
        return
      }

      console.log('Room members found:', memberIds?.length || 0, memberIds)

      if (!memberIds || memberIds.length === 0) {
        console.log('No members in room yet')
        setGroupMembers([])
        return
      }

      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_id, nama, avatar_url, interest')
        .in('user_id', memberIds.map(m => m.user_id))

      if (profileError) {
        console.error('Error fetching profiles:', profileError)
        return
      }

      console.log('✅ Group members loaded:', profiles?.length || 0)

      if (profiles) {
        setGroupMembers(profiles as UserProfile[])
      }
    } catch (error) {
      console.error('Error loading group members:', error)
    }
  }

  const subscribeToRoomMembers = () => {
    if (!chatRoom) return

    const channel = supabase
      .channel(`room-members-${chatRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'room_members',
          filter: `room_id=eq.${chatRoom.id}`
        },
        async (payload) => {
          console.log('Room members changed:', payload)
          // Reload members when there's any change
          await loadGroupMembers()
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to room members realtime updates')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }

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

            const { data: lastMsg } = await supabase
              .from('private_messages')
              .select('message')
              .eq('chat_id', chat.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single()

            return {
              ...chat,
              otherUser: profile || { user_id: otherUserId, nama: 'Unknown', avatar_url: null },
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
          avatar_url: otherUser.avatar_url
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

          return { ...msg, user_profiles: profile }
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

  const subscribeToPrivateMessages = () => {
    if (!selectedPrivateChat) return

    const channel = supabase
      .channel(`private-chat-${selectedPrivateChat.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
          filter: `chat_id=eq.${selectedPrivateChat.id}`
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('nama, avatar_url')
            .eq('user_id', payload.new.sender_id)
            .single()

          const newMsg = {
            ...payload.new,
            user_profiles: profile
          } as PrivateMessage

          setPrivateMessages((prev) => [...prev, newMsg])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

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

  // Loading state saat AI sedang kategorisasi atau load chat room
  if (loading || !chatRoom) {
    const getStepMessage = () => {
      switch (categorizationStep) {
        case 1:
          return { title: 'Menganalisis Interest...', desc: `Membaca: "${currentUser.interest}"` }
        case 2:
          return { title: 'Mengirim ke AI...', desc: 'Memproses dengan teknologi AI' }
        case 3:
          return { title: 'Kategori Ditemukan!', desc: `Anda cocok dengan: ${detectedCategory}` }
        case 4:
          return { title: 'Bergabung ke Community...', desc: `Masuk ke ${detectedCategory} Community` }
        case 5:
          return { title: 'Berhasil!', desc: 'Mengarahkan ke chat room...' }
        default:
          return { title: 'Memuat Chat Room...', desc: 'Mohon tunggu sebentar' }
      }
    }

    const { title, desc } = getStepMessage()

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-lg mx-auto">
          {/* Icon Animation */}
          <div className="flex justify-center mb-6">
            {categorizationStep === 3 ? (
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center animate-bounce">
                <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600"></div>
              </div>
            )}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
            {title}
          </h2>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
            {desc}
          </p>

          {/* Progress Steps */}
          <div className="space-y-3 mb-6">
            {[
              { step: 1, label: 'Analisis Interest', icon: '🔍' },
              { step: 2, label: 'AI Processing', icon: '🤖' },
              { step: 3, label: 'Kategori Terdeteksi', icon: '✨' },
              { step: 4, label: 'Join Community', icon: '👥' }
            ].map(({ step, label, icon }) => (
              <div key={step} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  categorizationStep >= step
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                }`}>
                  {categorizationStep > step ? '✓' : icon}
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${
                    categorizationStep >= step
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {label}
                  </div>
                </div>
                {categorizationStep === step && (
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Interest Box */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-lg border border-blue-200 dark:border-gray-600">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Your Interest:</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {currentUser.interest}
            </p>
            {detectedCategory && (
              <>
                <div className="my-2 border-t border-blue-200 dark:border-gray-600"></div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">AI Category:</p>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {detectedCategory}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // WhatsApp-style Layout dengan Sidebar
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

      {/* Main Container - WhatsApp Style */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Sidebar - Chat List */}
        <div className="w-96 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              {currentUser.avatar_url ? (
                <img src={currentUser.avatar_url} alt="Avatar" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-lg font-bold">
                  {currentUser.nama?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex-1">
                <h2 className="font-semibold text-gray-900 dark:text-white">{currentUser.nama}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser.interest}</p>
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-2">
              <button
                onClick={() => setChatMode('group')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  chatMode === 'group'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Group Chat
              </button>
              <button
                onClick={() => setChatMode('private')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  chatMode === 'private'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Private Chats
              </button>
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {chatMode === 'group' ? (
              /* Group Chat - Show Members List */
              <div className="p-4">
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-1">{chatRoom?.name}</h3>
                  <p className="text-xs text-blue-700 dark:text-blue-300">{selectedInterest?.description}</p>
                </div>
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Group Members ({groupMembers.length})</h3>
                </div>
                <div className="space-y-2">
                  {groupMembers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p className="text-sm">No members found</p>
                      <p className="text-xs mt-1">Check console for debug info</p>
                    </div>
                  ) : (
                    groupMembers.map((member) => (
                    <button
                      key={member.user_id}
                      onClick={() => startPrivateChat(member)}
                      disabled={member.user_id === currentUser.user_id}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        member.user_id === currentUser.user_id
                          ? 'bg-gray-50 dark:bg-gray-700/50 cursor-default'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'
                      }`}
                    >
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt={member.nama} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                          {member.nama?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {member.nama} {member.user_id === currentUser.user_id && '(You)'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{member.interest}</p>
                      </div>
                      {member.user_id !== currentUser.user_id && (
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      )}
                    </button>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* Private Chats List */
              <div>
                {privateChats.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <svg className="w-16 h-16 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-sm">No private chats yet</p>
                    <p className="text-xs mt-1">Click on a member in Group Chat to start chatting</p>
                  </div>
                ) : (
                  privateChats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => {
                        setSelectedPrivateChat(chat)
                        loadPrivateMessages(chat.id)
                      }}
                      className={`w-full flex items-center gap-3 p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        selectedPrivateChat?.id === chat.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      {chat.otherUser.avatar_url ? (
                        <img src={chat.otherUser.avatar_url} alt={chat.otherUser.nama} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold">
                          {chat.otherUser.nama?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-gray-900 dark:text-white">{chat.otherUser.nama}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{chat.lastMessage}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
          {chatMode === 'group' && chatRoom ? (
            /* Group Chat View */
            <>
              {/* Chat Header */}
              <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{chatRoom.name}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{groupMembers.length} members</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                    <p>Belum ada pesan. Mulai percakapan!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwnMessage = msg.user_id === currentUser.user_id
                    return (
                      <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                          {!isOwnMessage && (
                            <div className="flex items-center gap-2 mb-1">
                              {msg.user_profiles?.avatar_url ? (
                                <img
                                  src={msg.user_profiles.avatar_url}
                                  alt={msg.user_profiles.nama}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold">
                                  {msg.user_profiles?.nama?.[0]?.toUpperCase() || 'U'}
                                </div>
                              )}
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:underline"
                                onClick={() => {
                                  const member = groupMembers.find(m => m.user_id === msg.user_id)
                                  if (member) startPrivateChat(member)
                                }}
                              >
                                {msg.user_profiles?.nama || 'User'}
                              </span>
                            </div>
                          )}
                          <div className={`px-4 py-2 rounded-2xl ${
                            isOwnMessage
                              ? 'bg-blue-600 text-white rounded-tr-sm'
                              : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-tl-sm shadow'
                          }`}>
                            <p className="break-words">{msg.message}</p>
                            <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                              {formatTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : chatMode === 'private' && selectedPrivateChat ? (
            /* Private Chat View */
            <>
              {/* Chat Header */}
              <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex items-center gap-3">
                <button
                  onClick={() => setSelectedPrivateChat(null)}
                  className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                {selectedPrivateChat.otherUser.avatar_url ? (
                  <img src={selectedPrivateChat.otherUser.avatar_url} alt={selectedPrivateChat.otherUser.nama} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold">
                    {selectedPrivateChat.otherUser.nama?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedPrivateChat.otherUser.nama}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Private Chat</p>
                </div>
                {/* Video Call Button */}
                <button
                  onClick={() => setIsVideoCallOpen(true)}
                  className="p-3 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-full transition-colors group"
                  title="Start video call"
                >
                  <svg className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {privateMessages.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                    <p>Start your conversation with {selectedPrivateChat.otherUser.nama}!</p>
                  </div>
                ) : (
                  privateMessages.map((msg) => {
                    const isOwnMessage = msg.sender_id === currentUser.user_id
                    return (
                      <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                          isOwnMessage
                            ? 'bg-blue-600 text-white rounded-tr-sm'
                            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-tl-sm shadow'
                        }`}>
                          <p className="break-words">{msg.message}</p>
                          <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendPrivateMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    onClick={sendPrivateMessage}
                    disabled={!newMessage.trim()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* No Chat Selected */
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
    </div>
  )
}
