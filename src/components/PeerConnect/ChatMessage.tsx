import { useState, useEffect } from 'react'
import { ChatMessageData, UserProfile } from './types'
import { formatTime } from './utils'
import MaterialLinkMessage from './MaterialLinkMessage'
import { getUserTotalXP, getBadgeByLevel } from '@/lib/badges'
import { calculateLevel } from '@/lib/levelSystem'
import type { Badge } from '@/types/database'

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
  const [userBadge, setUserBadge] = useState<Badge | null>(null)

  // Fetch user badge (ranking system)
  useEffect(() => {
    async function loadUserBadge() {
      if (!message.user_id) return

      try {
        const totalXP = await getUserTotalXP(message.user_id)
        const userLevel = calculateLevel(totalXP)
        const badge = await getBadgeByLevel(userLevel)
        setUserBadge(badge)
      } catch (error) {
        console.error('Error loading user badge:', error)
      }
    }

    if (!isOwnMessage) {
      loadUserBadge()
    }
  }, [message.user_id, isOwnMessage])

  // Check if this message contains a material link
  const hasMaterialLink = message.material_id && message.material_data

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {!isOwnMessage && (
          <div className="flex items-center gap-2 mb-1">
            {message.user_profiles?.avatar_url ? (
              <img
                src={message.user_profiles.avatar_url}
                alt={message.user_profiles.nama}
                className="w-6 h-6 rounded-full object-cover border-2 border-black"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-blue-400 flex items-center justify-center text-white text-xs font-black border-2 border-black">
                {message.user_profiles?.nama?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              <span
                className="text-xs font-black text-black cursor-pointer hover:underline"
                onClick={() => {
                  const member = groupMembers.find(m => m.user_id === message.user_id)
                  if (member) onStartPrivateChat(member)
                }}
              >
                {message.user_profiles?.nama || 'User'}
              </span>
              <div className="flex items-center gap-1.5">
                {message.user_profiles?.role && (
                  <span className="text-[10px] px-2 py-0.5 bg-yellow-300 text-black font-black capitalize border border-black rounded-full whitespace-nowrap">
                    {message.user_profiles.role}
                  </span>
                )}
                {userBadge && userBadge.gambar && (
                  <img
                    src={userBadge.gambar}
                    alt={userBadge.nama}
                    className="w-3 h-3 object-contain"
                    title={userBadge.nama}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Render material link if present */}
        {hasMaterialLink ? (
          <div className="space-y-2">
            {message.message && message.message.trim() && (
              <div className={`px-4 py-2 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
                isOwnMessage
                  ? 'bg-yellow-300 text-black'
                  : 'bg-white text-black'
              }`}>
                <p className="break-words font-bold">{message.message}</p>
              </div>
            )}
            <MaterialLinkMessage
              material={message.material_data!}
              isOwnMessage={isOwnMessage}
            />
            <p className={`text-xs font-bold ${isOwnMessage ? 'text-right text-black/70' : 'text-black/70'}`}>
              {formatTime(message.created_at)}
            </p>
          </div>
        ) : (
          <div className={`px-4 py-2 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
            isOwnMessage
              ? 'bg-yellow-300 text-black'
              : 'bg-white text-black'
          }`}>
            <p className="break-words font-bold">{message.message}</p>
            <p className={`text-xs mt-1 font-bold ${isOwnMessage ? 'text-black/70' : 'text-black/70'}`}>
              {formatTime(message.created_at)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
