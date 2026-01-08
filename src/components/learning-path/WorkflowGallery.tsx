'use client';

import { useState, useEffect } from 'react';

interface Workflow {
    id: string;
    title: string;
    description: string | null;
    star_count: number;
    user_id: string;
    topics: { id: number; title: string } | null;
    hasStarred?: boolean;
}

interface WorkflowGalleryProps {
    onSelect: (workflow: Workflow) => void;
    onBack: () => void;
    userId?: string;
}

export default function WorkflowGallery({ onSelect, onBack, userId }: WorkflowGalleryProps) {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [grouped, setGrouped] = useState<Record<string, Workflow[]>>({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [toast, setToast] = useState<string | null>(null);

    // Auto-hide toast after 3 seconds
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    useEffect(() => {
        fetchWorkflows();
    }, []);

    const fetchWorkflows = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/workflows`);
            const data = await response.json();

            if (data.success) {
                setWorkflows(data.data || []);
                setGrouped(data.grouped || {});
            }
        } catch (error) {
            console.error('Failed to fetch workflows:', error);
        }
        setLoading(false);
    };

    const handleStar = async (e: React.MouseEvent, workflow: Workflow) => {
        e.stopPropagation();
        if (!userId) {
            setToast('Login terlebih dahulu untuk star workflow');
            return;
        }

        // Check if user owns workflow
        if (workflow.user_id === userId) {
            setToast('Tidak bisa star workflow milik sendiri');
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/workflows/${workflow.id}/star`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId
                }
            });
            const data = await response.json();
            if (!data.success) {
                setToast(data.error || 'Gagal star workflow');
            } else {
                fetchWorkflows();
            }
        } catch (error) {
            console.error('Failed to star:', error);
            setToast('Gagal star workflow');
        }
    };

    const filteredGrouped = Object.entries(grouped).reduce((acc, [topic, wfs]) => {
        const filtered = wfs.filter(w =>
            w.title.toLowerCase().includes(search.toLowerCase())
        );
        if (filtered.length > 0) {
            acc[topic] = filtered;
        }
        return acc;
    }, {} as Record<string, Workflow[]>);

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 p-6">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-8">
                <button
                    onClick={onBack}
                    className="text-gray-800 hover:text-black font-bold mb-4 flex items-center gap-2 transition-all duration-300 hover:scale-105"
                >
                    ← Kembali
                </button>
                <h1 className="text-3xl md:text-4xl font-black text-black mb-2">
                    📚 Workflow Gallery
                </h1>
                <p className="text-gray-700 font-semibold">
                    Jelajahi dan import workflow dari komunitas
                </p>

                {/* Search */}
                <div className="mt-6">
                    <input
                        type="text"
                        placeholder="Cari workflow..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full max-w-md px-4 py-3 bg-white border-2 border-black rounded-xl 
              text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="animate-spin h-12 w-12 border-4 border-pink-400 border-t-transparent rounded-full" />
                    </div>
                ) : Object.keys(filteredGrouped).length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">📭</div>
                        <p className="text-gray-700 text-lg font-semibold">Belum ada workflow public</p>
                    </div>
                ) : (
                    Object.entries(filteredGrouped).map(([topic, wfs]) => (
                        <div key={topic} className="mb-10">
                            <h2 className="text-xl md:text-2xl font-black text-black mb-4 flex items-center gap-2">
                                📁 {topic}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {wfs.map((workflow) => (
                                    <div
                                        key={workflow.id}
                                        onClick={() => onSelect(workflow)}
                                        className="bg-white rounded-xl p-5 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] 
                      hover:border-pink-400 cursor-pointer transition-all hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
                      hover:-translate-y-1 hover:scale-102"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="font-bold text-black text-lg">
                                                {workflow.title}
                                            </h3>
                                            <button
                                                onClick={(e) => handleStar(e, workflow)}
                                                className="flex items-center gap-1 text-yellow-500 hover:text-yellow-600"
                                            >
                                                ⭐ {workflow.star_count}
                                            </button>
                                        </div>
                                        {workflow.description && (
                                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                                {workflow.description}
                                            </p>
                                        )}
                                        <div className="text-xs text-gray-500 font-semibold">
                                            {workflow.topics?.title || 'Topik tidak diketahui'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-6 right-6 bg-yellow-400 text-black font-bold px-4 py-3 rounded-lg border-2 border-black shadow-lg z-50">
                    ⚠️ {toast}
                </div>
            )}
        </div>
    );
}
