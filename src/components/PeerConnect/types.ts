import type { PrivateChat, PrivateMessage } from "@/types/database"

export interface Interest {
  id: number
  name: string
  description: string
  icon?: string | null
}

export interface ChatRoom {
  id: string
  interest_id: number
  name: string
  created_at: string
  icon?: string | null
}

export interface MaterialLinkData {
  id: number
  title: string
  slug: string
  material_type: string
  topic?: string
}

export interface ChatMessageData {
  id: string
  room_id: string
  user_id: string
  message: string
  created_at: string
  material_id?: number | null
  material_data?: MaterialLinkData | null
  user_profiles?: {
    nama: string
    avatar_url: string
    role?: string
    badge_id?: number | null
  }
}

export interface UserProfile {
  user_id: string
  nama: string
  interest: string | null
  interest_id: number | null
  avatar_url: string
  role?: string
  badge_id?: number | null
}

export interface PrivateChatWithUser extends PrivateChat {
  otherUser: {
    user_id: string
    nama: string
    avatar_url: string | null
    role?: string
    badge_id?: number | null
  }
  lastMessage?: string
}

export type ChatMode = 'group' | 'private'

export { PrivateMessage }
