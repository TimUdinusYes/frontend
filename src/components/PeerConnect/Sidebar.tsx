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
            onClick={() => onChatModeChange('group')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              chatMode === 'group'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Group Chat
          </button>
          <button
            onClick={() => onChatModeChange('private')}
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
