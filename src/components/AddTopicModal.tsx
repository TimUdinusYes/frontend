'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface AddTopicModalProps {
  userId: string
  onClose: () => void
  onSuccess: () => void
}

export default function AddTopicModal({ userId, onClose, onSuccess }: AddTopicModalProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      // Insert into pending_topics table for admin approval
      const { error } = await supabase
        .from('pending_topics')
        .insert({
          title: formData.title,
          description: formData.description || null,
          requested_by: userId,
          status: 'pending'
        })

      if (error) throw error

      setMessage({
        type: 'success',
        text: 'Request topik berhasil dikirim! Menunggu persetujuan admin.'
      })

      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (error: any) {
      console.error('Failed to submit topic request:', error)
      setMessage({
        type: 'error',
        text: error.message || 'Gagal mengirim request topik'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white rounded-xl border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-lg w-full overflow-hidden transform transition-all">
        {/* Header */}
        <div className="flex justify-between items-center p-6 bg-blue-300 border-b-[3px] border-black">
          <h2 className="text-2xl font-black text-white uppercase tracking-wider text-shadow-sm">
            Request Topik Baru
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-black transition-colors transform hover:rotate-90 duration-300"
            disabled={loading}
          >
            <svg className="w-8 h-8 drop-shadow-md" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Info Banner */}
        <div className="mx-6 mt-6 p-4 bg-yellow-300 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg flex gap-3 items-start">
          <span className="text-2xl">⚠️</span>
          <p className="text-sm font-bold text-black leading-tight pt-1">
            Topik baru akan memerlukan persetujuan dari admin sebelum dapat digunakan.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-base font-black text-black mb-2 uppercase tracking-wide">
              Judul Topik <span className="text-pink-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-3 bg-white border-[3px] border-black rounded-lg 
                shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] 
                focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all outline-none 
                font-bold text-black placeholder-gray-400"
              placeholder="Contoh: JavaScript Fundamentals"
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-base font-black text-black mb-2 uppercase tracking-wide">
              Deskripsi (Opsional)
            </label>
            <textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-3 bg-white border-[3px] border-black rounded-lg 
                shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] 
                focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all outline-none 
                font-bold text-black placeholder-gray-400 resize-none"
              placeholder="Deskripsi singkat tentang topik ini"
              disabled={loading}
            />
          </div>

          {/* Message */}
          {message && (
            <div
              className={`rounded-lg border-[3px] border-black p-4 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${message.type === 'error'
                ? 'bg-red-400 text-white'
                : 'bg-green-400 text-black'
                }`}
            >
              <p className="text-sm">{message.text}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gray-200 border-[3px] border-black text-black font-black rounded-lg 
                shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] 
                hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              BATAL
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-purple-500 text-white border-[3px] border-black font-black rounded-lg 
                shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] 
                hover:-translate-y-1 hover:bg-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'MENGIRIM...' : 'KIRIM REQUEST'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
