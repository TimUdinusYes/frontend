import { ChatMessageData, UserProfile } from './types'
import { formatTime } from './utils'

interface ChatMessageProps {
  message: ChatMessageData
  isOwnMessage: boolean
  groupMembers: UserProfile[]
  onStartPrivateChat: (member: UserProfile) => void
}

export default function ChatMessage({
  message,
  isOwnMessage,
  groupMembers,
  onStartPrivateChat
}: ChatMessageProps) {
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {!isOwnMessage && (
          <div className="flex items-center gap-2 mb-1">
            {message.user_profiles?.avatar_url ? (
              <img
                src={message.user_profiles.avatar_url}
                alt={message.user_profiles.nama}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold">
                {message.user_profiles?.nama?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="flex flex-col">
              <span
                className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:underline"
                onClick={() => {
                  const member = groupMembers.find(m => m.user_id === message.user_id)
                  if (member) onStartPrivateChat(member)
                }}
              >
                {message.user_profiles?.nama || 'User'}
              </span>
              {message.user_profiles?.role && (
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold capitalize">
                  {message.user_profiles.role}
                </span>
              )}
            </div>
          </div>
        )}
        <div className={`px-4 py-2 rounded-2xl ${
          isOwnMessage
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-tl-sm shadow'
        }`}>
          <p className="break-words">{message.message}</p>
          <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
            {formatTime(message.created_at)}
          </p>
        </div>
      </div>
    </div>
  )
}
