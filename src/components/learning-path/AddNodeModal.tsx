'use client';

import { useState } from 'react';

interface AddNodeModalProps {
    topicId: number;
    isOpen: boolean;
    onClose: () => void;
    onNodeCreated: () => void;
    userId?: string;
}

export default function AddNodeModal({ topicId, isOpen, onClose, onNodeCreated, userId }: AddNodeModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#6366f1');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [suggestion, setSuggestion] = useState<{ title: string; id: string } | null>(null);

    const colors = ['#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e', '#10b981', '#14b8a6', '#06b6d4', '#f59e0b'];

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuggestion(null);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/nodes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic_id: topicId,
                    title,
                    description,
                    color,
                    user_id: userId
                })
            });

            const data = await response.json();

            if (data.isDuplicate) {
                setError(data.reason);
                if (data.similarNode) {
                    setSuggestion(data.similarNode);
                }
            } else if (data.success) {
                setTitle('');
                setDescription('');
                onNodeCreated();
                onClose();
            } else {
                setError(data.error || 'Gagal membuat node');
            }
        } catch (err) {
            setError('Gagal terhubung ke server');
        }

        setLoading(false);
    };

    const handleUseSuggestion = () => {
        if (suggestion) {
            onNodeCreated();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full overflow-hidden">
                {/* Header */}
                <div className="bg-green-400 px-8 py-6 border-b-[4px] border-black">
                    <h2 className="text-2xl font-black text-black">➕ Tambah Node Baru</h2>
                    <p className="text-base text-black/80 font-bold">
                        AI akan memeriksa duplikasi otomatis
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5 bg-blue-50">
                    {/* Title */}
                    <div>
                        <label className="block text-base font-black text-black mb-2">
                            Nama Node *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full px-5 py-3 text-base bg-white border-[3px] border-black
                text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-400"
                            placeholder="contoh: Aljabar Linear"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-base font-black text-black mb-2">
                            Deskripsi
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-5 py-3 text-base bg-white border-[3px] border-black
                text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
                            placeholder="Deskripsi singkat tentang node ini"
                        />
                    </div>

                    {/* Color */}
                    <div>
                        <label className="block text-base font-black text-black mb-3">
                            Warna
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {colors.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`w-12 h-12 border-[3px] border-black transition-all ${color === c ? 'ring-4 ring-black scale-110' : ''
                                        }`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Error / Suggestion */}
                    {error && (
                        <div className="bg-yellow-200 border-[3px] border-yellow-600 p-5">
                            <p className="text-yellow-900 text-base font-bold">{error}</p>
                            {suggestion && (
                                <button
                                    type="button"
                                    onClick={handleUseSuggestion}
                                    className="mt-3 text-base text-yellow-900 hover:text-yellow-700 underline font-bold"
                                >
                                    Gunakan &ldquo;{suggestion.title}&rdquo; yang sudah ada →
                                </button>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4 pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 text-base bg-red-500 hover:bg-red-400 text-white border-[3px] border-black
                font-black transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
                hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !title}
                            className="flex-1 py-3 text-base bg-green-500 hover:bg-green-400 disabled:bg-gray-400
                text-white border-[3px] border-black font-black transition-all flex items-center justify-center gap-2
                shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]
                hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:hover:translate-x-0 disabled:hover:translate-y-0"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin h-5 w-5 border-[3px] border-white border-t-transparent" />
                                    Memeriksa...
                                </>
                            ) : (
                                'Buat Node'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
