import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { MaterialLinkData } from './types'

interface Material {
  id: number
  title: string
  url: string
  material_type: string
  topic_id: number
  topics?: {
    title: string
  }[]
}

interface MaterialShareModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectMaterial: (material: MaterialLinkData, message?: string) => void
  currentUserId: string
}

export default function MaterialShareModal({
  isOpen,
  onClose,
  onSelectMaterial,
  currentUserId
}: MaterialShareModalProps) {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadMaterials()
    }
  }, [isOpen])

  const loadMaterials = async () => {
    setLoading(true)
    try {
      // Load all published materials (no creator filter since created_by field doesn't exist)
      const { data, error } = await supabase
        .from('materials')
        .select(`
          id,
          title,
          url,
          material_type,
          topic_id,
          topics (
            title
          )
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Loaded materials:', data)
      setMaterials(data || [])
    } catch (error) {
      console.error('Error loading materials:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
    } finally {
      setLoading(false)
    }
  }

  const handleShare = () => {
    if (!selectedMaterial) return

    const materialData: MaterialLinkData = {
      id: selectedMaterial.id,
      title: selectedMaterial.title,
      slug: selectedMaterial.url,
      material_type: selectedMaterial.material_type,
      topic: selectedMaterial.topics?.[0]?.title
    }

    onSelectMaterial(materialData, message.trim() || undefined)

    // Reset
    setSelectedMaterial(null)
    setMessage('')
    setSearchQuery('')
    onClose()
  }

  const filteredMaterials = materials.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.topics?.[0]?.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b-[3px] border-black bg-blue-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black text-black">
              Share Learning Material
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-400 rounded-lg transition-colors text-black font-black border-2 border-black"
            >
              ✕
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search materials..."
              className="w-full px-4 py-2 pl-10 border-2 border-black rounded-lg bg-white text-black font-bold focus:outline-none focus:ring-2 focus:ring-yellow-300"
            />
            <svg className="w-5 h-5 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Materials List */}
        <div className="p-6 overflow-y-auto max-h-96 bg-blue-50">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-24 h-24 mx-auto mb-4 animate-bounce">
                <img src="/skate.png" alt="Loading" className="w-full h-full" />
              </div>
              <p className="text-black font-bold mt-4">Loading materials...</p>
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="text-center py-8 bg-yellow-200 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-8">
              <div className="text-6xl mb-4">📚</div>
              <p className="font-black text-black text-lg mb-2">No materials found</p>
              <p className="text-sm text-black/70 font-bold">Create materials in the mentor dashboard first</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMaterials.map((material) => (
                <button
                  key={material.id}
                  onClick={() => setSelectedMaterial(material)}
                  className={`w-full text-left p-4 rounded-lg border-[3px] border-black transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] ${
                    selectedMaterial?.id === material.id
                      ? 'bg-yellow-300'
                      : 'bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`px-3 py-1 rounded-lg text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                      material.material_type === 'video' ? 'bg-red-300 text-black' :
                      material.material_type === 'pdf' ? 'bg-blue-300 text-black' :
                      'bg-green-300 text-black'
                    }`}>
                      {material.material_type}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black text-black">{material.title}</h3>
                      {material.topics && material.topics.length > 0 && (
                        <p className="text-sm text-black/70 mt-1 font-bold">
                          📚 {material.topics[0].title}
                        </p>
                      )}
                    </div>
                    {selectedMaterial?.id === material.id && (
                      <div className="flex-shrink-0 w-6 h-6 bg-green-400 rounded-full border-2 border-black flex items-center justify-center">
                        <span className="text-black text-lg font-black">✓</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message Input & Actions */}
        {selectedMaterial && (
          <div className="p-6 border-t-[3px] border-black space-y-4 bg-green-200">
            <div>
              <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">
                Add a message (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a message to accompany this material..."
                rows={3}
                className="w-full px-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300 bg-white text-black font-bold resize-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-300 text-black rounded-lg font-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                className="flex-1 px-4 py-2 bg-green-400 text-black rounded-lg font-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              >
                Share Material
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
