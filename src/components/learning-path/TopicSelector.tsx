'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Topic } from '@/types/database';

interface TopicSelectorProps {
    onSelect: (topic: Topic) => void;
    onCancel: () => void;
    userId?: string;
}

export default function TopicSelector({ onSelect, onCancel, userId }: TopicSelectorProps) {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [newTopicTitle, setNewTopicTitle] = useState('');
    const [newTopicDesc, setNewTopicDesc] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [requestSent, setRequestSent] = useState(false);

    useEffect(() => {
        fetchTopics();
    }, []);

    const fetchTopics = async () => {
        const { data, error } = await supabase
            .from('topics')
            .select('*')
            .order('title');

        if (!error && data) {
            setTopics(data);
        }
        setLoading(false);
    };

    const handleRequestTopic = async () => {
        if (!newTopicTitle.trim() || !userId) return;

        setSubmitting(true);
        try {
            // Insert into pending_topics table
            const { data, error } = await supabase
                .from('pending_topics')
                .insert({
                    title: newTopicTitle.trim(),
                    description: newTopicDesc.trim() || null,
                    requested_by: userId,
                    status: 'pending'
                })
                .select();

            console.log('Insert pending topic result:', { data, error, userId });

            if (error) {
                console.error('Failed to insert pending topic:', error);
                alert(`Gagal mengirim request: ${error.message}`);
            } else {
                setRequestSent(true);
                setNewTopicTitle('');
                setNewTopicDesc('');
            }
        } catch (error) {
            console.error('Failed to request topic:', error);
        }
        setSubmitting(false);
    };

    const filteredTopics = topics.filter(t =>
        t.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-5xl w-full border-2 border-black overflow-hidden">
                {/* Header */}
                <div className="bg-blue-300 px-6 py-4 border-b-2 border-black">
                    <h2 className="text-xl font-black text-black flex items-center gap-2">
                        {showRequestForm ? (
                            <>
                                <img src="/materi.png" alt="Icon" className="w-12 h-12 object-contain" />
                                Request Topik Baru
                            </>
                        ) : 'Pilih Topik'}
                    </h2>
                    <p className="text-sm text-black font-semibold">
                        {showRequestForm
                            ? 'Request akan dikirim ke admin untuk persetujuan'
                            : 'Pilih topik untuk workflow baru Anda'}
                    </p>
                </div>

                {showRequestForm ? (
                    /* Request Form */
                    <div className="p-6">
                        {requestSent ? (
                            <div className="text-center py-8">
                                <div className="text-5xl mb-4">✅</div>
                                <h3 className="text-lg font-black text-black mb-2">
                                    Request Terkirim!
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    Admin akan meninjau request Anda segera
                                </p>
                                <button
                                    onClick={() => {
                                        setShowRequestForm(false);
                                        setRequestSent(false);
                                    }}
                                    className="px-4 py-2 bg-yellow-400 text-black font-bold rounded-lg border-2 border-black"
                                >
                                    Kembali ke Daftar Topik
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="mb-4">
                                    <label className="text-sm text-gray-700 font-bold block mb-1">Nama Topik *</label>
                                    <input
                                        type="text"
                                        value={newTopicTitle}
                                        onChange={(e) => setNewTopicTitle(e.target.value)}
                                        placeholder="Contoh: Machine Learning, Web Development..."
                                        className="w-full px-4 py-2 bg-white border-2 border-black rounded-lg 
                                            text-black focus:outline-none focus:ring-2 focus:ring-pink-400"
                                    />
                                </div>
                                <div className="mb-6">
                                    <label className="text-sm text-gray-700 font-bold block mb-1">Deskripsi (opsional)</label>
                                    <textarea
                                        value={newTopicDesc}
                                        onChange={(e) => setNewTopicDesc(e.target.value)}
                                        placeholder="Jelaskan tentang topik ini..."
                                        rows={3}
                                        className="w-full px-4 py-2 bg-white border-2 border-black rounded-lg 
                                            text-black focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowRequestForm(false)}
                                        className="flex-1 py-2 bg-red-500 hover:bg-red-400 text-white font-bold rounded-lg border-2 border-black"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleRequestTopic}
                                        disabled={!newTopicTitle.trim() || submitting}
                                        className="flex-1 py-2 bg-pink-400 text-black font-bold rounded-lg border-2 border-black disabled:bg-gray-300"
                                    >
                                        {submitting ? 'Mengirim...' : 'Kirim Request'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Search */}
                        <div className="px-6 py-4 border-b-2 border-black">
                            <input
                                type="text"
                                placeholder="Cari topik..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full px-4 py-2 bg-white border-2 border-black rounded-lg 
                                    text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400"
                            />
                        </div>

                        {/* Topic List */}
                        <div className="max-h-96 overflow-y-auto p-6">
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin h-8 w-8 border-4 border-pink-400 border-t-transparent rounded-full" />
                                </div>
                            ) : filteredTopics.length === 0 ? (
                                <p className="text-center text-gray-600 py-8 font-semibold">
                                    Tidak ada topik ditemukan
                                </p>
                            ) : (
                                <div className="grid grid-cols-3 gap-4 auto-rows-fr">
                                    {filteredTopics.map((topic) => (
                                        <button
                                            key={topic.id}
                                            onClick={() => onSelect(topic)}
                                            className="text-left px-4 py-3 rounded-lg bg-white
                                                hover:bg-pink-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                                                hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5
                                                transition-all group h-full"
                                        >
                                            <div className="font-bold text-black group-hover:text-pink-600 line-clamp-2 break-words overflow-hidden">
                                                {topic.title}
                                            </div>
                                            {topic.description && (
                                                <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                                                    {topic.description}
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer with Request Button */}
                        <div className="px-6 py-4 bg-blue-50 flex justify-between items-center border-t-2 border-black">
                            <button
                                onClick={() => setShowRequestForm(true)}
                                className="text-sm text-pink-600 hover:text-pink-700 font-bold flex items-center gap-1"
                            >
                                ➕ Topik tidak ada? Request topik baru
                            </button>
                            <button
                                onClick={onCancel}
                                className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white font-bold rounded-lg border-2 border-black transition-colors"
                            >
                                Batal
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
