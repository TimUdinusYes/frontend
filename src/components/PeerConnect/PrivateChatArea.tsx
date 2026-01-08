import { useRef, useEffect, useState } from 'react'
import { PrivateChatWithUser, PrivateMessage, MaterialLinkData } from './types'
import { formatTime } from './utils'
import MaterialLinkMessage from './MaterialLinkMessage'
import { getBadgeById } from '@/lib/badges'
import type { Badge } from '@/types/database'

interface PrivateChatAreaProps {
  selectedChat: PrivateChatWithUser
  messages: PrivateMessage[]
  currentUserId: string
  currentUserRole?: string
  newMessage: string
  onNewMessageChange: (message: string) => void
  onSendMessage: () => void
  onSendMaterialLink: (material: MaterialLinkData, message?: string) => void
  onBack: () => void
  onVideoCall: () => void
  onOpenMaterialShare: () => void
}

export default function PrivateChatArea({
  selectedChat,
  messages,
  currentUserId,
  currentUserRole,
  newMessage,
  onNewMessageChange,
  onSendMessage,
  onSendMaterialLink,
  onBack,
  onVideoCall,
  onOpenMaterialShare
}: PrivateChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [badge, setBadge] = useState<Badge | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Fetch badge when selectedChat changes
  useEffect(() => {
    const fetchBadge = async () => {
      if (selectedChat.otherUser.badge_id) {
        const badgeData = await getBadgeById(selectedChat.otherUser.badge_id)
        setBadge(badgeData)
      } else {
        setBadge(null)
      }
    }
    fetchBadge()
  }, [selectedChat.otherUser.badge_id])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSendMessage()
    }
  }

  return (
    <>
      {/* Chat Header */}
      <div className="bg-purple-300 border-b-2 border-black px-6 py-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="lg:hidden p-2 bg-white border-2 border-black rounded-lg hover:bg-gray-100"
        >
          <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {selectedChat.otherUser.avatar_url ? (
          <img src={selectedChat.otherUser.avatar_url} alt={selectedChat.otherUser.nama} className="w-10 h-10 rounded-full object-cover border-2 border-black" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 transition-colors border-2 border-black flex items-center justify-center text-white font-black">
            {selectedChat.otherUser.nama?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-black">{selectedChat.otherUser.nama}</h2>
            {badge && badge.gambar && (
              <img
                src={badge.gambar}
                alt={badge.nama}
                className="w-10 h-10 object-contain"
                title={badge.nama}
              />
            )}
          </div>
          {selectedChat.otherUser.role && (
            <span className="inline-block px-2 py-0.5 bg-white border border-black text-xs font-bold text-black capitalize rounded">{selectedChat.otherUser.role}</span>
          )}
        </div>
        {/* Video Call Button */}
        <button
          onClick={onVideoCall}
          className="p-3 bg-green-400 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          title="Start video call"
        >
          <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center mt-8">
            <div className="inline-block bg-pink-300 px-6 py-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-black font-bold">Start your conversation with {selectedChat.otherUser.nama}! 💬</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.sender_id === currentUserId
            const hasMaterialLink = msg.material_id && msg.material_data

            return (
              <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                {hasMaterialLink ? (
                  <div className={`max-w-[70%] space-y-2`}>
                    {msg.message && msg.message.trim() && (
                      <div className={`px-4 py-2 rounded-xl border-2 border-black ${isOwnMessage
                        ? 'bg-teal-400 text-black'
                        : 'bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        }`}>
                        <p className="break-words font-medium">{msg.message}</p>
                      </div>
                    )}
                    <MaterialLinkMessage
                      material={msg.material_data!}
                      isOwnMessage={isOwnMessage}
                    />
                    <p className={`text-xs ${isOwnMessage ? 'text-right text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                ) : (
                  <div className={`max-w-[70%] px-4 py-2 rounded-xl border-2 border-black ${isOwnMessage
                    ? 'bg-teal-400 text-black'
                    : 'bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    }`}>
                    <p className="break-words font-medium">{msg.message}</p>
                    <p className={`text-xs mt-1 ${isOwnMessage ? 'text-teal-700' : 'text-gray-600'} font-semibold`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                )}
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t-2 border-black p-4">
        <div className="flex gap-3">
          {/* Share Material Button - Only for mentors */}
          {currentUserRole === 'mentor' && (
            <button
              onClick={onOpenMaterialShare}
              className="p-3 bg-purple-400 text-black border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              title="Share learning material"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          )}

          <input
            type="text"
            value={newMessage}
            onChange={(e) => onNewMessageChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border-2 border-black rounded-xl focus:ring-2 focus:ring-black bg-white text-black font-medium"
          />
          <button
            onClick={onSendMessage}
            disabled={!newMessage.trim()}
            className="px-6 py-3 bg-teal-400 text-black rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed transition-all font-black"
          >
            Send
          </button>
        </div>
      </div>
    </>
  )
}
