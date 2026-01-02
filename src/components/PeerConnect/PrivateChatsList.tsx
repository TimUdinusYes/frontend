import { PrivateChatWithUser } from './types'

interface PrivateChatsListProps {
  privateChats: PrivateChatWithUser[]
  selectedChatId: string | null
  onSelectChat: (chat: PrivateChatWithUser) => void
}

export default function PrivateChatsList({
  privateChats,
  selectedChatId,
  onSelectChat
}: PrivateChatsListProps) {
  if (privateChats.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <svg className="w-16 h-16 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p className="text-sm">No private chats yet</p>
        <p className="text-xs mt-1">Click on a member in Group Chat to start chatting</p>
      </div>
    )
  }

  return (
    <div>
      {privateChats.map((chat) => (
        <button
          key={chat.id}
          onClick={() => onSelectChat(chat)}
          className={`w-full flex items-center gap-3 p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
            selectedChatId === chat.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
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
      ))}
    </div>
  )
}
