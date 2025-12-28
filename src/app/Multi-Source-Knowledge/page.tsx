'use client'

import Link from "next/link"
import MaterialList from "@/components/MaterialList"

export default function MultiSourceKnowledgePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-indigo-600 hover:underline mb-4 inline-block font-semibold">
            ← Kembali ke Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Multi-Source Knowledge
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Kelola materi pembelajaran dari berbagai sumber dalam satu tempat
          </p>
        </div>

        {/* Material List Component */}
        <MaterialList />
      </div>
    </div>
  )
}
