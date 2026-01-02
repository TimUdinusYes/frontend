import { useRef, useEffect } from 'react'
import { PrivateChatWithUser, PrivateMessage } from './types'
import { formatTime } from './utils'

interface PrivateChatAreaProps {
  selectedChat: PrivateChatWithUser
  messages: PrivateMessage[]
  currentUserId: string
  newMessage: string
  onNewMessageChange: (message: string) => void
  onSendMessage: () => void
  onBack: () => void
  onVideoCall: () => void
}

export default function PrivateChatArea({
  selectedChat,
  messages,
  currentUserId,
  newMessage,
  onNewMessageChange,
  onSendMessage,
  onBack,
  onVideoCall
}: PrivateChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSendMessage()
    }
  }

  return (
    <>
      {/* Chat Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {selectedChat.otherUser.avatar_url ? (
          <img src={selectedChat.otherUser.avatar_url} alt={selectedChat.otherUser.nama} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold">
            {selectedChat.otherUser.nama?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedChat.otherUser.nama}</h2>
          {selectedChat.otherUser.role && (
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold capitalize">{selectedChat.otherUser.role}</p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">Private Chat</p>
        </div>
        {/* Video Call Button */}
        <button
          onClick={onVideoCall}
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
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            <p>Start your conversation with {selectedChat.otherUser.nama}!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.sender_id === currentUserId
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
            onChange={(e) => onNewMessageChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={onSendMessage}
            disabled={!newMessage.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Send
          </button>
        </div>
      </div>
    </>
  )
}
