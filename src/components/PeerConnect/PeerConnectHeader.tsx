import Link from "next/link"

interface PeerConnectHeaderProps {
  currentUser: {
    nama: string
  }
}

export default function PeerConnectHeader({ currentUser }: PeerConnectHeaderProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4">
      <div className="max-w-full mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Home
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">PeerConnect</h1>
        </div>
        <Link
          href="/profile"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          Edit Profile
        </Link>
      </div>
    </div>
  )
}
