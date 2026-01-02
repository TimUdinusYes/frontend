import { useRef, useEffect } from 'react'
import { ChatRoom, ChatMessageData, UserProfile } from './types'
import ChatMessage from './ChatMessage'

interface GroupChatAreaProps {
  chatRoom: ChatRoom
  messages: ChatMessageData[]
  groupMembers: UserProfile[]
  currentUserId: string
  newMessage: string
  onNewMessageChange: (message: string) => void
  onSendMessage: () => void
  onStartPrivateChat: (member: UserProfile) => void
}

export default function GroupChatArea({
  chatRoom,
  messages,
  groupMembers,
  currentUserId,
  newMessage,
  onNewMessageChange,
  onSendMessage,
  onStartPrivateChat
}: GroupChatAreaProps) {
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
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isOwnMessage={msg.user_id === currentUserId}
              groupMembers={groupMembers}
              onStartPrivateChat={onStartPrivateChat}
            />
          ))
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
