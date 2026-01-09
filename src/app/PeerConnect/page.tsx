'use client'

import { useState } from "react"
import VideoCallModal from "@/components/VideoCallModal"
import {
  Sidebar,
  GroupChatArea,
  PrivateChatArea,
  LoadingScreen,
  MaterialShareModal,
  PeerConnectHeader,
  PeerConnectEmptyState,
  type ChatMode,
  type UserProfile
} from "@/components/PeerConnect"
import { useUserProfile } from "@/components/PeerConnect/hooks/useUserProfile"
import { useChatRoom } from "@/components/PeerConnect/hooks/useChatRoom"
import { useGroupChat } from "@/components/PeerConnect/hooks/useGroupChat"
import { usePrivateChat } from "@/components/PeerConnect/hooks/usePrivateChat"

export default function PeerConnectPage() {
  // User & Auth States
  const { currentUser, initialLoading, setCurrentUser } = useUserProfile()

  // Chat Mode State
  const [chatMode, setChatMode] = useState<ChatMode>('group')

  // Chat Room & Categorization States
  const {
    chatRoom,
    selectedInterest,
    loading,
    categorizationStep,
    detectedCategory
  } = useChatRoom(currentUser, setCurrentUser)

  // Group Chat States
  const {
    messages,
    groupMembers,
    newMessage,
    setNewMessage,
    sendMessage,
    sendMaterialMessage
  } = useGroupChat(chatRoom, currentUser)

  // Wrapper for GroupChatArea's onSendMessage (which takes no params)
  const handleSendGroupMessage = () => {
    if (newMessage.trim()) {
      sendMessage()
    }
  }

  // Private Chat States
  const {
    privateChats,
    selectedPrivateChat,
    privateMessages,
    startPrivateChat,
    handleSelectPrivateChat,
    sendMessage: sendPrivateMessage,
    sendMaterialMessage: sendPrivateMaterialMessage,
    setSelectedPrivateChat
  } = usePrivateChat(currentUser, loading)

  // Wrapper for startPrivateChat that also switches to private mode
  const handleStartPrivateChat = async (member: UserProfile) => {
    if (!currentUser || member.user_id === currentUser.user_id) return

    try {
      // Get or create chat ID first
      const { findOrCreatePrivateChat } = await import('@/components/PeerConnect/services/privateChatService')
      const chatId = await findOrCreatePrivateChat(currentUser.user_id, member.user_id)

      // Create chat object immediately
      const chatWithUser = {
        id: chatId,
        user1_id: currentUser.user_id < member.user_id ? currentUser.user_id : member.user_id,
        user2_id: currentUser.user_id < member.user_id ? member.user_id : currentUser.user_id,
        created_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
        otherUser: {
          user_id: member.user_id,
          nama: member.nama,
          avatar_url: member.avatar_url,
          role: member.role
        },
        lastMessage: 'Start chatting!'
      }

      // Set selected chat and switch mode immediately
      setSelectedPrivateChat(chatWithUser)
      setChatMode('private')

      // Load data in background
      await startPrivateChat(member)
    } catch (error) {
      console.error('Error starting private chat:', error)
      alert('Gagal memulai private chat')
    }
  }

  // Wrapper for PrivateChatArea's onSendMessage (which takes no params)
  const handleSendPrivateMessage = () => {
    if (newMessage.trim()) {
      sendPrivateMessage(newMessage)
    }
  }

  // Video Call State
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false)

  // Material Share State
  const [isMaterialShareOpen, setIsMaterialShareOpen] = useState(false)
  const [materialShareMode, setMaterialShareMode] = useState<'group' | 'private'>('group')

  // ============================================
  // RENDER
  // ============================================

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-black mx-auto mb-4"></div>
          <p className="text-black font-bold">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-100">
        <div className="text-center">
          <p className="text-black font-bold">Loading...</p>
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
    <div className="min-h-screen bg-blue-100">
      {/* Top Header Bar */}
      <PeerConnectHeader currentUser={currentUser} />

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
          onStartPrivateChat={handleStartPrivateChat}
          onSelectPrivateChat={handleSelectPrivateChat}
        />

        {/* Right Side - Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {chatMode === 'group' && chatRoom ? (
            <GroupChatArea
              chatRoom={chatRoom}
              messages={messages}
              groupMembers={groupMembers}
              currentUserId={currentUser.user_id}
              currentUserRole={currentUser.role}
              newMessage={newMessage}
              onNewMessageChange={setNewMessage}
              onSendMessage={handleSendGroupMessage}
              onSendMaterialLink={sendMaterialMessage}
              onStartPrivateChat={handleStartPrivateChat}
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
              onSendMessage={handleSendPrivateMessage}
              onSendMaterialLink={sendPrivateMaterialMessage}
              onBack={() => setSelectedPrivateChat(null)}
              onVideoCall={() => setIsVideoCallOpen(true)}
              onOpenMaterialShare={() => {
                setMaterialShareMode('private')
                setIsMaterialShareOpen(true)
              }}
            />
          ) : (
            <PeerConnectEmptyState chatMode={chatMode} />
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
