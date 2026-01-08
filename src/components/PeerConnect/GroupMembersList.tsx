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
      <div className="mb-4 p-3 bg-teal-100 rounded-xl border-2 border-black">
        <h3 className="font-black text-black mb-1">💬 {chatRoom?.name}</h3>
        <p className="text-xs text-gray-800 font-semibold">{selectedInterest?.description}</p>
      </div>
      <div className="mb-3">
        <h3 className="text-sm font-black text-black">
          👥 Group Members ({groupMembers.length})
        </h3>
      </div>
      <div className="space-y-2">
        {groupMembers.length === 0 ? (
          <div className="text-center py-8 bg-yellow-100 rounded-xl border-2 border-black p-4">
            <p className="text-sm font-bold text-black">No members found</p>
            <p className="text-xs mt-1 text-gray-700">Check console for debug info</p>
          </div>
        ) : (
          groupMembers.map((member) => (
            <button
              key={member.user_id}
              onClick={() => onStartPrivateChat(member)}
              disabled={member.user_id === currentUserId}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 border-black transition-all ${member.user_id === currentUserId
                  ? 'bg-gray-100 cursor-default'
                  : 'bg-white hover:bg-yellow-50 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer'
                }`}
            >
              {member.avatar_url ? (
                <img src={member.avatar_url} alt={member.nama} className="w-10 h-10 rounded-full object-cover border-2 border-black" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 transition-colors border-2 border-black flex items-center justify-center text-white text-sm font-black">
                  {member.nama?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex-1 text-left">
                <p className="font-bold text-black">
                  {member.nama} {member.user_id === currentUserId && '(You)'}
                </p>
                {member.role && (
                  <span className="inline-block px-2 py-0.5 bg-blue-200 border border-black text-xs font-bold text-black capitalize rounded">
                    {member.role}
                  </span>
                )}
                <p className="text-xs text-gray-700 font-medium truncate">{member.interest}</p>
              </div>
              {member.user_id !== currentUserId && (
                <div className="w-8 h-8 bg-green-400 border-2 border-black rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  )
}

