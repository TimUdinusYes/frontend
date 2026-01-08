'use client';

import { useState, useEffect, useCallback } from 'react';

interface LearningNode {
    id: string;
    title: string;
    description: string | null;
    color: string;
    usage_count: number;
}

interface NodeSidebarProps {
    topicId: number;
    onDragStart: (node: LearningNode) => void;
    onAddNode: () => void;
    refreshKey?: number; // Increment to trigger refresh
}

export default function NodeSidebar({ topicId, onDragStart, onAddNode, refreshKey }: NodeSidebarProps) {
    const [nodes, setNodes] = useState<LearningNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [collapsed, setCollapsed] = useState(false);

    const fetchNodes = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/nodes/${topicId}`);
            const data = await response.json();
            if (data.success) {
                setNodes(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch nodes:', error);
        }
        setLoading(false);
    }, [topicId]);

    useEffect(() => {
        if (topicId) {
            fetchNodes();
        }
    }, [topicId, fetchNodes, refreshKey]); // refreshKey triggers refetch

    const filteredNodes = nodes.filter(n =>
        n.title.toLowerCase().includes(search.toLowerCase())
    );

    const handleDragStart = (e: React.DragEvent, node: LearningNode) => {
        e.dataTransfer.setData('application/json', JSON.stringify(node));
        e.dataTransfer.effectAllowed = 'copy';
        onDragStart(node);
    };

    if (collapsed) {
        return (
            <button
                onClick={() => setCollapsed(false)}
                className="absolute left-4 top-4 z-10 bg-white p-3 border-[3px] border-black
          hover:bg-yellow-300 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
                📚
            </button>
        );
    }

    return (
        <div className="absolute left-4 top-4 bottom-4 w-72 bg-white border-[3px] border-black
      shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] z-10 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b-[3px] border-black flex items-center justify-between bg-yellow-300">
                <h3 className="font-black text-black">📚 Nodes</h3>
                <button
                    onClick={() => setCollapsed(true)}
                    className="text-black hover:text-red-600 font-black text-xl"
                >
                    ✕
                </button>
            </div>

            {/* Search */}
            <div className="p-3 border-b-[3px] border-black bg-blue-100">
                <input
                    type="text"
                    placeholder="Cari node..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-3 py-2 bg-white border-[2px] border-black
            text-black text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
            </div>

            {/* Node List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
                    </div>
                ) : filteredNodes.length === 0 ? (
                    <p className="text-center text-slate-400 text-sm py-4">
                        {nodes.length === 0 ? 'Belum ada node' : 'Tidak ditemukan'}
                    </p>
                ) : (
                    filteredNodes.map((node) => (
                        <div
                            key={node.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, node)}
                            className="px-3 py-2 rounded-lg border border-slate-600 cursor-grab 
                hover:border-indigo-500 hover:bg-slate-700/50 transition-all
                active:cursor-grabbing group"
                            style={{ borderLeftColor: node.color, borderLeftWidth: 3 }}
                        >
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: node.color }}
                                />
                                <span className="text-sm text-white font-medium">{node.title}</span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1 flex justify-between">
                                <span className="line-clamp-1">{node.description || 'No description'}</span>
                                <span className="text-indigo-400">×{node.usage_count}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Node Button */}
            <div className="p-3 border-t border-slate-700">
                <button
                    onClick={onAddNode}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg 
            font-medium transition-colors flex items-center justify-center gap-2"
                >
                    ➕ Tambah Node
                </button>
            </div>
        </div>
    );
}
