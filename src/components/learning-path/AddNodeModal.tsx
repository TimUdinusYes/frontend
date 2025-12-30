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
    const [icon, setIcon] = useState('📚');
    const [color, setColor] = useState('#6366f1');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [suggestion, setSuggestion] = useState<{ title: string; id: string } | null>(null);

    const icons = ['📚', '📖', '📝', '💡', '🎯', '🔬', '🧮', '📐', '🧬', '🌍', '💻', '🎨'];
    const colors = ['#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e', '#10b981', '#14b8a6', '#06b6d4', '#f59e0b'];

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuggestion(null);

        try {
            const response = await fetch('http://localhost:8080/api/nodes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic_id: topicId,
                    title,
                    description,
                    icon,
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
            <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-slate-700 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                    <h2 className="text-xl font-bold text-white">➕ Tambah Node Baru</h2>
                    <p className="text-sm text-white/80">
                        AI akan memeriksa duplikasi otomatis
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            Nama Node *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg 
                text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="contoh: Aljabar Linear"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            Deskripsi
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg 
                text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                            placeholder="Deskripsi singkat tentang node ini"
                        />
                    </div>

                    {/* Icon */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Icon
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {icons.map((i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setIcon(i)}
                                    className={`text-2xl p-2 rounded-lg transition-all ${icon === i
                                        ? 'bg-green-600 ring-2 ring-green-400'
                                        : 'bg-slate-700 hover:bg-slate-600'
                                        }`}
                                >
                                    {i}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Warna
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {colors.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`w-8 h-8 rounded-lg transition-all ${color === c ? 'ring-2 ring-white scale-110' : ''
                                        }`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Error / Suggestion */}
                    {error && (
                        <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-4">
                            <p className="text-amber-200 text-sm">{error}</p>
                            {suggestion && (
                                <button
                                    type="button"
                                    onClick={handleUseSuggestion}
                                    className="mt-2 text-sm text-amber-400 hover:text-amber-300 underline"
                                >
                                    Gunakan &ldquo;{suggestion.title}&rdquo; yang sudah ada →
                                </button>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !title}
                            className="flex-1 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-600 
                text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
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
