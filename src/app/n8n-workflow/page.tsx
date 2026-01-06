'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Topic } from '@/types/database';
import TopicSelector from '@/components/learning-path/TopicSelector';
import WorkflowGallery from '@/components/learning-path/WorkflowGallery';
import { supabase } from '@/lib/supabase';

const LearningPathCanvas = dynamic(
  () => import('@/components/learning-path/LearningPathCanvas'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
          <p className="text-slate-400">Loading canvas...</p>
        </div>
      </div>
    )
  }
);

const TopicImportModal = dynamic(
  () => import('@/components/learning-path/TopicImportModal'),
  { ssr: false }
);

type ViewMode = 'entry' | 'select-topic' | 'gallery' | 'topic-import' | 'canvas';

interface Workflow {
  id: string;
  title: string;
  description: string | null;
  star_count: number;
  user_id: string;
  topics: { id: number; title: string } | null;
}

export default function LearningPathPage() {
  const [mode, setMode] = useState<ViewMode>('entry');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [userId, setUserId] = useState<string | undefined>();
  const [forkedWorkflow, setForkedWorkflow] = useState<Workflow | null>(null);
  const [initialData, setInitialData] = useState<{
    edges: Array<{ source_node: { id: string; label: string }; target_node: { id: string; label: string } }>;
    node_positions: Record<string, { x: number; y: number }>;
  } | null>(null);

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
      }
    });
  }, []);

  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic);
    setForkedWorkflow(null);
    setInitialData(null);
    setMode('canvas');
  };

  const handleWorkflowSelect = async (workflow: Workflow) => {
    // View workflow only (no fork yet - fork happens on save)
    if (!userId) {
      alert('Please login first');
      return;
    }

    try {
      // Just GET the workflow to view (not fork)
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/workflows/${workflow.id}`, {
        method: 'GET',
        headers: {
          'x-user-id': userId
        }
      });

      const data = await response.json();
      if (data.success) {
        setSelectedTopic({
          id: workflow.topics?.id || 0,
          title: workflow.topics?.title || '',
          description: null,
          created_by: '',
          created_at: '',
          updated_at: ''
        });
        setForkedWorkflow(workflow); // Store original workflow for fork on save
        setInitialData({
          edges: data.data.edges || [],
          node_positions: data.data.node_positions || {}
        });
        setMode('canvas');
      }
    } catch (error) {
      console.error('Failed to load workflow:', error);
    }
  };

  const handleTopicImport = async (topicId: number) => {
    if (!userId) {
      alert('Please login first');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/topics/${topicId}/convert-to-workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        }
      });

      const data = await response.json();
      if (data.success) {
        // Load the converted workflow
        const workflow = data.data;
        setSelectedTopic({
          id: workflow.topics?.id || topicId,
          title: workflow.topics?.title || '',
          description: null,
          created_by: '',
          created_at: '',
          updated_at: ''
        });
        setInitialData({
          edges: workflow.edges || [],
          node_positions: workflow.node_positions || {}
        });
        setMode('canvas');

        if (data.fromCache) {
          alert('✅ Workflow dimuat dari database (sudah pernah di-convert)');
        } else {
          alert('✨ AI berhasil membuat workflow baru dari topik!');
        }
      }
    } catch (error) {
      console.error('Failed to convert topic:', error);
      alert('Gagal mengkonversi topik ke workflow');
    }
  };

  const handleSaveWorkflow = async (data: {
    title: string;
    edges: Array<{ source: string; target: string; data?: { reason?: string; isValid?: boolean } }>;
    positions: Record<string, { x: number; y: number }>
  }) => {
    if (!userId || !selectedTopic) return;

    try {
      const edgesData = data.edges.map(e => ({
        source_node_id: e.source,
        target_node_id: e.target,
        validation_reason: e.data?.reason || null,
        is_valid: e.data?.isValid ?? true
      }));

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          topic_id: selectedTopic.id,
          title: data.title,
          is_public: true,
          node_positions: data.positions,
          edges: edgesData
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('Workflow berhasil disimpan!');
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
      alert('Gagal menyimpan workflow');
    }
  };

  // Entry Page
  if (mode === 'entry') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center px-16 py-6">
        <div className="w-full">
          <Link
            href="/"
            className="text-slate-400 hover:text-white mb-8 flex items-center gap-2 transition-colors"
          >
            ← Kembali ke Home
          </Link>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              🎓 Learning Path Builder
            </h1>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Buat jalur pembelajaran visual dengan validasi AI atau import dari komunitas
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mx-auto items-start">
            {/* Create New */}
            <button
              onClick={() => setMode('select-topic')}
              className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-10
                text-left hover:scale-[1.02] transition-all shadow-2xl group border border-indigo-500/30
                w-full aspect-square flex flex-col justify-between"
            >
              <div>
                <div className="text-6xl mb-5">🆕</div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Buat Workflow Baru
                </h2>
                <p className="text-indigo-200 text-base">
                  Pilih topik dan mulai membuat learning path dari awal
                </p>
              </div>
              <div className="text-indigo-300 group-hover:text-white transition-colors flex items-center gap-2 text-base">
                Mulai →
              </div>
            </button>

            {/* Import from Community */}
            <button
              onClick={() => setMode('gallery')}
              className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-10
                text-left hover:scale-[1.02] transition-all shadow-2xl group border border-emerald-500/30
                w-full aspect-square flex flex-col justify-between"
            >
              <div>
                <div className="text-6xl mb-5">📥</div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Import dari Komunitas
                </h2>
                <p className="text-emerald-200 text-base">
                  Jelajahi workflow public dan fork untuk dimodifikasi
                </p>
              </div>
              <div className="text-emerald-300 group-hover:text-white transition-colors flex items-center gap-2 text-base">
                Jelajahi →
              </div>
            </button>

            {/* Import from Knowledge Base */}
            <button
              onClick={() => setMode('topic-import')}
              className="bg-gradient-to-br from-amber-600 to-orange-700 rounded-3xl p-10
                text-left hover:scale-[1.02] transition-all shadow-2xl group border border-amber-500/30
                w-full aspect-square flex flex-col justify-between"
            >
              <div>
                <div className="text-6xl mb-5">🤖</div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Import dari Materi
                </h2>
                <p className="text-amber-200 text-base">
                  AI otomatis membuat workflow dari topik di knowledge base
                </p>
              </div>
              <div className="text-amber-300 group-hover:text-white transition-colors flex items-center gap-2 text-base">
                Import →
              </div>
            </button>
          </div>

        </div>
      </div>
    );
  }

  // Topic Selection
  if (mode === 'select-topic') {
    return (
      <div className="min-h-screen bg-slate-900">
        <TopicSelector
          onSelect={handleTopicSelect}
          onCancel={() => setMode('entry')}
          userId={userId}
        />
      </div>
    );
  }

  // Gallery
  if (mode === 'gallery') {
    return (
      <WorkflowGallery
        onSelect={handleWorkflowSelect}
        onBack={() => setMode('entry')}
        userId={userId}
      />
    );
  }

  // Topic Import
  if (mode === 'topic-import') {
    return (
      <TopicImportModal
        onImport={handleTopicImport}
        onBack={() => setMode('entry')}
        userId={userId}
      />
    );
  }

  // Canvas
  if (mode === 'canvas' && selectedTopic) {
    return (
      <div className="h-screen flex flex-col bg-slate-900">
        {/* Header */}
        <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMode('entry')}
              className="text-slate-400 hover:text-white transition-colors"
            >
              ← Kembali
            </button>
            <div className="h-6 w-px bg-slate-700" />
            <h1 className="text-xl font-bold text-white">
              🎓 Learning Path Builder
            </h1>
            {forkedWorkflow && (
              <span className="text-xs bg-emerald-600/20 text-emerald-400 px-2 py-1 rounded">
                Forked from: {forkedWorkflow.title}
              </span>
            )}
          </div>
          <div className="text-sm text-slate-400">
            Topik: <span className="text-indigo-400 font-medium">{selectedTopic.title}</span>
          </div>
        </header>

        {/* Canvas */}
        <main className="flex-1 overflow-hidden">
          <LearningPathCanvas
            topic={selectedTopic}
            userId={userId}
            onSave={handleSaveWorkflow}
            initialData={initialData || undefined}
          />
        </main>
      </div>
    );
  }

  return null;
}
