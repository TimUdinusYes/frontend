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
            const response = await fetch('http://localhost:8080/api/workflows');
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

        // Check if user owns the workflow
        if (workflow.user_id === userId) {
            setToast('Tidak bisa star workflow milik sendiri');
            return;
        }

        try {
            const response = await fetch(`http://localhost:8080/api/workflows/${workflow.id}/star`, {
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
        <div className="min-h-screen bg-slate-900 p-6">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-8">
                <button
                    onClick={onBack}
                    className="text-slate-400 hover:text-white mb-4 flex items-center gap-2"
                >
                    ← Kembali
                </button>
                <h1 className="text-3xl font-bold text-white mb-2">
                    📚 Workflow Gallery
                </h1>
                <p className="text-slate-400">
                    Jelajahi dan import workflow dari komunitas
                </p>

                {/* Search */}
                <div className="mt-6">
                    <input
                        type="text"
                        placeholder="Cari workflow..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full max-w-md px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl 
              text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full" />
                    </div>
                ) : Object.keys(filteredGrouped).length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">📭</div>
                        <p className="text-slate-400 text-lg">Belum ada workflow public</p>
                    </div>
                ) : (
                    Object.entries(filteredGrouped).map(([topic, wfs]) => (
                        <div key={topic} className="mb-10">
                            <h2 className="text-xl font-semibold text-indigo-400 mb-4 flex items-center gap-2">
                                📁 {topic}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {wfs.map((workflow) => (
                                    <div
                                        key={workflow.id}
                                        onClick={() => onSelect(workflow)}
                                        className="bg-slate-800 rounded-xl p-5 border border-slate-700 
                      hover:border-indigo-500 cursor-pointer transition-all hover:shadow-lg
                      hover:shadow-indigo-500/10"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="font-semibold text-white text-lg">
                                                {workflow.title}
                                            </h3>
                                            <button
                                                onClick={(e) => handleStar(e, workflow)}
                                                className="flex items-center gap-1 text-amber-400 hover:text-amber-300"
                                            >
                                                ⭐ {workflow.star_count}
                                            </button>
                                        </div>
                                        {workflow.description && (
                                            <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                                                {workflow.description}
                                            </p>
                                        )}
                                        <div className="text-xs text-slate-500">
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
                <div className="fixed bottom-6 right-6 bg-amber-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-pulse">
                    ⚠️ {toast}
                </div>
            )}
        </div>
    );
}
