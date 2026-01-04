import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { ChatRoom, Interest, UserProfile } from "../types"
import {
  loadChatRoomByInterestId,
  loadInterestById,
  joinRoom,
  categorizeUserInterest as categorizeInterest,
  findInterestByName,
  updateUserInterestId
} from "../services/chatService"

export const useChatRoom = (
  currentUser: UserProfile | null,
  onUpdateUser?: (user: UserProfile) => void
) => {
  const router = useRouter()
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null)
  const [selectedInterest, setSelectedInterest] = useState<Interest | null>(null)
  const [loading, setLoading] = useState(false)
  const [categorizationStep, setCategorizationStep] = useState(0)
  const [detectedCategory, setDetectedCategory] = useState<string>("")

  const loadRoomByInterestId = async (interestId: number) => {
    try {
      const room = await loadChatRoomByInterestId(interestId)
      if (room) {
        setChatRoom(room)

        const interest = await loadInterestById(interestId)
        if (interest) setSelectedInterest(interest)
      }
      return room
    } catch (error) {
      console.error('Error loading chat room:', error)
      throw error
    }
  }

  const categorizeUserInterest = async (interestText: string, userProfile?: UserProfile) => {
    const profile = userProfile || currentUser
    if (!interestText.trim() || !profile) return

    setLoading(true)
    setCategorizationStep(1)

    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setCategorizationStep(2)

      const categoryName = await categorizeInterest(interestText)
      const categoryLabel = `${categoryName} (AI)`

      setDetectedCategory(categoryLabel)
      setCategorizationStep(3)
      await new Promise(resolve => setTimeout(resolve, 800))

      const interest = await findInterestByName(categoryName)
      if (!interest) throw new Error(`Category "${categoryName}" not found`)

      setSelectedInterest(interest)
      setCategorizationStep(4)
      await new Promise(resolve => setTimeout(resolve, 400))

      await updateUserInterestId(profile.user_id, interest.id)
      if (onUpdateUser) {
        onUpdateUser({ ...profile, interest_id: interest.id })
      }
      const room = await loadRoomByInterestId(interest.id)
      if (room) {
        await joinRoom(profile.user_id, room.id)
      }

      setCategorizationStep(5)
      setTimeout(() => {
        setLoading(false)
        setCategorizationStep(0)
      }, 1000)

    } catch (error: any) {
      console.error('Error categorizing interest:', error)
      setLoading(false)
      setCategorizationStep(0)
      router.push(`/profile?message=${encodeURIComponent('Gagal memproses minat')}`)
    }
  }

  const joinRoomHandler = async (userId: string, roomParam?: ChatRoom) => {
    const room = roomParam || chatRoom
    if (!room) return

    try {
      await joinRoom(userId, room.id)
    } catch (error) {
      console.error('Error joining room:', error)
    }
  }

  useEffect(() => {
    if (currentUser && !loading) {
      if (currentUser.interest_id) {
        loadRoomByInterestId(currentUser.interest_id).then(room => {
          if (room) joinRoomHandler(currentUser.user_id, room)
        })
      } else if (currentUser.interest && currentUser.interest.trim()) {
        categorizeUserInterest(currentUser.interest, currentUser)
      }
    }
  }, [currentUser?.user_id, loading])

  return {
    chatRoom,
    selectedInterest,
    loading,
    categorizationStep,
    detectedCategory,
    categorizeUserInterest,
    joinRoom: joinRoomHandler
  }
}
