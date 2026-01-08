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
      <div className="p-8 text-center">
        <div className="inline-block bg-pink-100 p-6 rounded-xl border-2 border-black">
          <div className="w-16 h-16 mx-auto mb-3 bg-yellow-300 rounded-full border-2 border-black flex items-center justify-center">
            <span className="text-3xl">💬</span>
          </div>
          <p className="text-sm font-bold text-black">No private chats yet</p>
          <p className="text-xs mt-1 text-gray-700 font-medium">Click on a member in Group Chat to start chatting</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-2">
      {privateChats.map((chat) => (
        <button
          key={chat.id}
          onClick={() => onSelectChat(chat)}
          className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 border-black transition-all ${selectedChatId === chat.id
              ? 'bg-purple-200 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
              : 'bg-white hover:bg-yellow-50 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
            }`}
        >
          {chat.otherUser.avatar_url ? (
            <img src={chat.otherUser.avatar_url} alt={chat.otherUser.nama} className="w-12 h-12 rounded-full object-cover border-2 border-black" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 transition-colors border-2 border-black flex items-center justify-center text-white font-black">
              {chat.otherUser.nama?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div className="flex-1 text-left">
            <p className="font-bold text-black">{chat.otherUser.nama}</p>
            <p className="text-sm text-gray-700 font-medium truncate">{chat.lastMessage}</p>
          </div>
        </button>
      ))}
    </div>
  )
}

