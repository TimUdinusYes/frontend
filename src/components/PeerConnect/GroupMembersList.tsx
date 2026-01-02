import { UserProfile, ChatRoom, Interest } from './types'

interface GroupMembersListProps {
  chatRoom: ChatRoom | null
  selectedInterest: Interest | null
  groupMembers: UserProfile[]
  currentUserId: string
  onStartPrivateChat: (member: UserProfile) => void
}

export default function GroupMembersList({
  chatRoom,
  selectedInterest,
  groupMembers,
  currentUserId,
  onStartPrivateChat
}: GroupMembersListProps) {
  return (
    <div className="p-4">
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-1">{chatRoom?.name}</h3>
        <p className="text-xs text-blue-700 dark:text-blue-300">{selectedInterest?.description}</p>
      </div>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Group Members ({groupMembers.length})
        </h3>
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
              onClick={() => onStartPrivateChat(member)}
              disabled={member.user_id === currentUserId}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                member.user_id === currentUserId
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
                  {member.nama} {member.user_id === currentUserId && '(You)'}
                </p>
                {member.role && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold capitalize">
                    {member.role}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{member.interest}</p>
              </div>
              {member.user_id !== currentUserId && (
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
