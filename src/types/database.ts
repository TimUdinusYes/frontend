export type UserRole = 'user' | 'admin' | 'teacher' | 'student' | 'mentor' | 'pending_mentor' | 'superadmin'
export type Gender = 'Pria' | 'Wanita' | 'Lainnya'

// Table: user (profiles table)
export interface Profile {
  id: string // uuid - Primary Key, references auth.users.id
  email: string // text
  username: string // text
  role: string // text (instead of enum for flexibility)
  created_at: string // timestamptz
  updated_at: string // timestamptz
}

export interface ProfileInsert {
  id: string
  email: string
  username: string
  role?: string
}

export interface ProfileUpdate {
  username?: string
  role?: string
}

// Table: user_profiles (detail user profile table)
export interface UserProfile {
  id: number // int8 - Primary Key
  created_at: string // timestamptz
  nama: string // text
  tanggal_lahir: string | null // date
  gender: string // text (from gender_enum)
  interest: string | null // text - User's free text input
  interest_id: number | null // int8 - Foreign Key to interests.id (categorized by AI)
  avatar_url: string | null // text
  user_id: string // uuid - Foreign Key to auth.users.id
  badge_id: number | null // int8
  quiz_scores?: Record<string, { score: number; answered_at: string; selected_answer: number; is_correct: boolean }> | null // jsonb
}

export interface UserProfileInsert {
  nama: string
  tanggal_lahir?: string | null
  gender: string
  interest?: string | null
  interest_id?: number | null
  avatar_url?: string | null
  user_id: string
  badge_id?: number | null
}

export interface UserProfileUpdate {
  nama?: string
  tanggal_lahir?: string | null
  gender?: string
  interest?: string | null
  interest_id?: number | null
  avatar_url?: string | null
  badge_id?: number | null
}

// ============================================
// TOPICS & MATERIALS TABLES
// ============================================

// Table: topics
export interface Topic {
  id: number // int8 - Primary Key
  title: string // text
  description: string | null // text
  created_by: string // uuid - Foreign Key to auth.users.id
  created_at: string // timestamptz
  updated_at: string // timestamptz
}

export interface TopicInsert {
  title: string
  description?: string | null
  created_by: string
}

export interface TopicUpdate {
  title?: string
  description?: string | null
}

// Material Page structure (stored in pages JSONB)
export interface MaterialPage {
  page_number: number
  content: string
}

// Table: materials
export interface Material {
  id: number // int8 - Primary Key
  topic_id: number // int8 - Foreign Key to topics.id
  title: string // text
  content: string // text (legacy, for backward compatibility)
  material_type: string // text (pdf, video, article, etc)
  url: string | null // text
  created_by: string // uuid - Foreign Key to auth.users.id
  created_at: string // timestamptz
  updated_at: string // timestamptz
  status: 'published' | 'draft' // text - default: 'draft'
  tags: string[] | null // array of text
  pages: MaterialPage[] // jsonb - multi-page content
}

export interface MaterialInsert {
  topic_id: number
  title: string
  content?: string // legacy
  material_type: string
  url?: string | null
  created_by: string
  status?: 'published' | 'draft'
  tags?: string[] | null
  pages?: MaterialPage[]
}

export interface MaterialUpdate {
  topic_id?: number
  title?: string
  content?: string // legacy
  material_type?: string
  url?: string | null
  status?: 'published' | 'draft'
  tags?: string[] | null
  pages?: MaterialPage[]
}

// ============================================
// PENDING TOPICS TABLE
// ============================================

export type PendingTopicStatus = 'pending' | 'approved' | 'rejected'

export interface PendingTopic {
  id: string // uuid - Primary Key
  title: string // text
  description: string | null // text
  requested_by: string | null // uuid - Foreign Key to auth.users.id
  status: string | null // text - default 'pending'
  reviewed_by: string | null // uuid - Foreign Key to auth.users.id
  created_at: string | null // timestamptz
  updated_at: string | null // timestamptz
  // Joined data
  requester?: Profile
}

export interface PendingTopicInsert {
  title: string
  description?: string | null
  requested_by: string
  status?: string
}

// ============================================
// PRIVATE CHAT TABLES
// ============================================

export interface PrivateChat {
  id: string // UUID
  user1_id: string // UUID
  user2_id: string // UUID
  created_at: string // timestamptz
  last_message_at: string // timestamptz
}

export interface PrivateMessage {
  id: string // UUID
  chat_id: string // UUID - FK to private_chats.id
  sender_id: string // UUID - FK to auth.users.id
  message: string // text
  created_at: string // timestamptz
  read_at: string | null // timestamptz
  material_id?: number | null // FK to materials.id
  user_profiles?: {
    nama: string
    avatar_url: string | null
  }
  material_data?: {
    id: number
    title: string
    slug: string
    material_type: string
    topic?: string
  } | null
}

// ============================================
// QUIZ TABLES
// ============================================

// Table: material_page_quizzes
export interface MaterialPageQuiz {
  id: number
  material_id: number
  page_number: number
  question: string
  options: string[] // ["Opsi A", "Opsi B", "Opsi C", "Opsi D"]
  correct_answer: number // Index 0-3
  created_at: string
}

// Table: user_material_quiz_scores (many-to-many)
export interface UserMaterialQuizScore {
  id: number
  user_id: string
  material_id: number
  page_scores: Record<string, 'benar' | 'salah'> // {"1": "benar", "2": "salah"}
  total_correct: number
  total_answered: number
  created_at: string
  updated_at: string
}
