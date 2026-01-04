import type { ChatMode } from "./types"

interface PeerConnectEmptyStateProps {
  chatMode: ChatMode
}

export default function PeerConnectEmptyState({ chatMode }: PeerConnectEmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
      <div className="text-center">
        <svg className="w-24 h-24 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <h3 className="text-lg font-semibold mb-2">Select a chat to start messaging</h3>
        <p className="text-sm">Choose from your {chatMode === 'group' ? 'group members' : 'private conversations'}</p>
      </div>
    </div>
  )
}
