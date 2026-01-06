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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-700 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                    <h2 className="text-xl font-bold text-white">
                        {showRequestForm ? '📝 Request Topik Baru' : 'Pilih Topik'}
                    </h2>
                    <p className="text-sm text-white/80">
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
                                <h3 className="text-lg font-bold text-white mb-2">
                                    Request Terkirim!
                                </h3>
                                <p className="text-slate-400 mb-6">
                                    Admin akan meninjau request Anda segera
                                </p>
                                <button
                                    onClick={() => {
                                        setShowRequestForm(false);
                                        setRequestSent(false);
                                    }}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
                                >
                                    Kembali ke Daftar Topik
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="mb-4">
                                    <label className="text-sm text-slate-400 block mb-1">Nama Topik *</label>
                                    <input
                                        type="text"
                                        value={newTopicTitle}
                                        onChange={(e) => setNewTopicTitle(e.target.value)}
                                        placeholder="Contoh: Machine Learning, Web Development..."
                                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg 
                                            text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="mb-6">
                                    <label className="text-sm text-slate-400 block mb-1">Deskripsi (opsional)</label>
                                    <textarea
                                        value={newTopicDesc}
                                        onChange={(e) => setNewTopicDesc(e.target.value)}
                                        placeholder="Jelaskan tentang topik ini..."
                                        rows={3}
                                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg 
                                            text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowRequestForm(false)}
                                        className="flex-1 py-2 bg-slate-700 text-white rounded-lg"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleRequestTopic}
                                        disabled={!newTopicTitle.trim() || submitting}
                                        className="flex-1 py-2 bg-indigo-600 text-white rounded-lg disabled:bg-slate-600"
                                    >
                                        {submitting ? 'Mengirim...' : '📤 Kirim Request'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Search */}
                        <div className="px-6 py-4 border-b border-slate-700">
                            <input
                                type="text"
                                placeholder="Cari topik..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg 
                                    text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Topic List */}
                        <div className="max-h-96 overflow-y-auto p-6">
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
                                </div>
                            ) : filteredTopics.length === 0 ? (
                                <p className="text-center text-slate-400 py-8">
                                    Tidak ada topik ditemukan
                                </p>
                            ) : (
                                <div className="grid grid-cols-3 gap-4 auto-rows-fr">
                                    {filteredTopics.map((topic) => (
                                        <button
                                            key={topic.id}
                                            onClick={() => onSelect(topic)}
                                            className="text-left px-4 py-3 rounded-lg bg-slate-700/50
                                                hover:bg-indigo-600/30 border border-transparent hover:border-indigo-500
                                                transition-all group h-full"
                                        >
                                            <div className="font-medium text-white group-hover:text-indigo-300 line-clamp-4">
                                                {topic.title}
                                            </div>
                                            {topic.description && (
                                                <div className="text-sm text-slate-400 mt-1 line-clamp-2">
                                                    {topic.description}
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer with Request Button */}
                        <div className="px-6 py-4 bg-slate-900/50 flex justify-between items-center">
                            <button
                                onClick={() => setShowRequestForm(true)}
                                className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                            >
                                ➕ Topik tidak ada? Request topik baru
                            </button>
                            <button
                                onClick={onCancel}
                                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
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
