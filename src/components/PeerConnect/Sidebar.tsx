import { UserProfile, ChatMode, ChatRoom, Interest, PrivateChatWithUser } from './types'
import GroupMembersList from './GroupMembersList'
import PrivateChatsList from './PrivateChatsList'

interface SidebarProps {
  currentUser: UserProfile
  chatMode: ChatMode
  chatRoom: ChatRoom | null
  selectedInterest: Interest | null
  groupMembers: UserProfile[]
  privateChats: PrivateChatWithUser[]
  selectedPrivateChatId: string | null
  onChatModeChange: (mode: ChatMode) => void
  onStartPrivateChat: (member: UserProfile) => void
  onSelectPrivateChat: (chat: PrivateChatWithUser) => void
}

export default function Sidebar({
  currentUser,
  chatMode,
  chatRoom,
  selectedInterest,
  groupMembers,
  privateChats,
  selectedPrivateChatId,
  onChatModeChange,
  onStartPrivateChat,
  onSelectPrivateChat
}: SidebarProps) {
  return (
    <div className="w-96 bg-white border-r-2 border-black flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b-2 border-black bg-pink-100">
        <div className="flex items-center gap-3 mb-4">
          {currentUser.avatar_url ? (
            <img src={currentUser.avatar_url} alt="Avatar" className="w-12 h-12 rounded-full object-cover border-2 border-black" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 transition-colors border-2 border-black flex items-center justify-center text-white text-lg font-black">
              {currentUser.nama?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div className="flex-1">
            <h2 className="font-black text-black">{currentUser.nama}</h2>
            <p className="text-xs text-gray-700 font-semibold">{currentUser.interest}</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2">
          <button
            onClick={() => onChatModeChange('group')}
            className={`flex-1 px-4 py-2 rounded-lg font-black transition-all border-2 border-black ${chatMode === 'group'
                ? 'bg-green-400 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white text-black hover:bg-gray-100'
              }`}
          >
            Group Chat
          </button>
          <button
            onClick={() => onChatModeChange('private')}
            className={`flex-1 px-4 py-2 rounded-lg font-black transition-all border-2 border-black ${chatMode === 'private'
                ? 'bg-purple-400 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white text-black hover:bg-gray-100'
              }`}
          >
            Private Chats
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto bg-white">
        {chatMode === 'group' ? (
          <GroupMembersList
            chatRoom={chatRoom}
            selectedInterest={selectedInterest}
            groupMembers={groupMembers}
            currentUserId={currentUser.user_id}
            onStartPrivateChat={onStartPrivateChat}
          />
        ) : (
          <PrivateChatsList
            privateChats={privateChats}
            selectedChatId={selectedPrivateChatId}
            onSelectChat={onSelectPrivateChat}
          />
        )}
      </div>
    </div>
  )
}

