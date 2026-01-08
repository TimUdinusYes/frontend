'use client';

import { useState, useEffect } from 'react';
import { Topic } from '@/types/database';
import { supabase } from '@/lib/supabase';

interface TopicImportModalProps {
  onImport: (topicId: number) => void;
  onBack: () => void;
  userId?: string;
}

export default function TopicImportModal({ onImport, onBack, userId }: TopicImportModalProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [converting, setConverting] = useState<number | null>(null);

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTopics(data || []);
    } catch (error) {
      console.error('Failed to load topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (topicId: number) => {
    setConverting(topicId);
    try {
      await onImport(topicId);
    } finally {
      setConverting(null);
    }
  };

  const filteredTopics = topics.filter(topic =>
    topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={onBack}
              className="text-gray-800 hover:text-black font-bold mb-4 flex items-center gap-2 transition-all duration-300 hover:scale-105"
            >
              ← Kembali
            </button>
            <h1 className="text-3xl md:text-4xl font-black text-black mb-2">
              🤖 Import dari Multi-Source Knowledge
            </h1>
            <p className="text-gray-700 font-semibold">
              Pilih topik untuk dikonversi otomatis oleh AI menjadi learning path workflow
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="🔍 Cari topik..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 text-black
              placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        {/* Topics Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-400 border-t-transparent" />
              <p className="text-gray-700 font-bold">Loading topics...</p>
            </div>
          </div>
        ) : filteredTopics.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-gray-700 text-lg font-semibold">
              {searchQuery ? 'Tidak ada topik yang cocok' : 'Belum ada topik tersedia'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTopics.map((topic) => (
              <div
                key={topic.id}
                className="bg-white rounded-xl p-6 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:border-yellow-400
                  transition-all group relative overflow-hidden hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:scale-102"
              >
                {/* Background gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 to-orange-400/5
                  opacity-0 group-hover:opacity-100 transition-opacity" />
 
                <div className="relative">
                  {/* Topic Info */}
                  <div className="mb-4">
                    <h3 className="text-xl font-black text-black mb-2 line-clamp-2">
                      {topic.title}
                    </h3>
                    {topic.description && (
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {topic.description}
                      </p>
                    )}
                  </div>
 
                  {/* Conversion Status */}
                  {(topic as any).is_converted && (
                    <div className="mb-4 flex items-center gap-2 text-sm">
                      <span className="bg-teal-400 text-black px-2 py-1 rounded-full border-2 border-black font-bold">
                        ✓ Sudah pernah di-convert
                      </span>
                    </div>
                  )}
 
                  {/* Action Button */}
                  <button
                    onClick={() => handleImport(topic.id)}
                    disabled={converting === topic.id}
                    className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-4 py-3 rounded-lg border-2 border-black transition-all
                      disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {converting === topic.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />
                        <span>Converting...</span>
                      </>
                    ) : (topic as any).is_converted ? (
                      <>
                        <span>📥</span>
                        <span>Load dari Database</span>
                      </>
                    ) : (
                      <>
                        <span>✨</span>
                        <span>Convert dengan AI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
 
        {/* Info Box */}
        <div className="mt-8 bg-yellow-100 border-2 border-black rounded-xl p-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex gap-4">
            <div className="text-3xl">💡</div>
            <div>
              <h3 className="text-black font-black mb-2">Cara Kerja AI Conversion:</h3>
              <ul className="text-gray-700 space-y-1 text-sm font-semibold">
                <li>• AI akan menganalisis judul dan deskripsi topik</li>
                <li>• Mengekstrak 3-8 pokok bahasan utama sebagai node</li>
                <li>• Menyusun urutan pembelajaran yang logis (dari dasar ke lanjutan)</li>
                <li>• Membuat koneksi antar node berdasarkan prerequisite</li>
                <li>• Hasil conversion disimpan, sehingga bisa langsung dimuat di kemudian hari</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
