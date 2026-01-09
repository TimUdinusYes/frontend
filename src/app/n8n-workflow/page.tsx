'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Topic } from '@/types/database';
import TopicSelector from '@/components/learning-path/TopicSelector';
import WorkflowGallery from '@/components/learning-path/WorkflowGallery';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '@/components/LoadingSpinner';

const LearningPathCanvas = dynamic(
  () => import('@/components/learning-path/LearningPathCanvas'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-blue-100">
        <LoadingSpinner text="Loading canvas..." />
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
      <div className="min-h-screen bg-blue-100 px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <Link
            href="/home"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black font-black border-2 border-black rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all mb-8"
          >
            <span className="text-xl">←</span>
            <span>Kembali ke Home</span>
          </Link>

          {/* Hero Section */}
          <div className="text-center mb-12 lg:mb-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-black mb-4 lg:mb-6">
              Learning Path Builder
            </h1>
            <p className="text-black/70 text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed font-bold">
              Buat jalur pembelajaran visual dengan validasi AI atau import dari komunitas
            </p>
          </div>

          {/* Main Options - Vertical Stack */}
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Option 1 - Buat Workflow Baru */}
            <button
              onClick={() => setMode('select-topic')}
              className="group relative w-full bg-pink-300 rounded-xl p-6 lg:p-8
                text-left transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                border-[3px] border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]
                overflow-hidden"
            >
              <div className="relative z-10 flex items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="flex-shrink-0 w-16 h-16 lg:w-20 lg:h-20 bg-white rounded-full flex items-center justify-center border-[3px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <span className="text-4xl lg:text-5xl">🆕</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-2xl lg:text-3xl font-black text-black">
                        Buat Workflow Baru
                      </h2>
                      <span className="px-3 py-1 bg-yellow-300 text-black text-xs font-black rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        RECOMMENDED
                      </span>
                    </div>
                    <p className="text-black/70 text-sm lg:text-base leading-relaxed font-bold">
                      Pilih topik dan mulai membuat learning path dari awal dengan drag-and-drop editor
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-yellow-300 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:bg-yellow-400 transition-colors">
                  <span className="text-2xl font-black">→</span>
                </div>
              </div>
            </button>

            {/* Option 2 - Import from Community */}
            <button
              onClick={() => setMode('gallery')}
              className="group relative w-full bg-blue-300 rounded-xl p-6 lg:p-8
                text-left transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                border-[3px] border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]
                overflow-hidden"
            >
              <div className="relative z-10 flex items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="flex-shrink-0 w-16 h-16 lg:w-20 lg:h-20 bg-white rounded-full flex items-center justify-center border-[3px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <span className="text-4xl lg:text-5xl">📥</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl lg:text-3xl font-black text-black mb-2">
                      Import dari Komunitas
                    </h3>
                    <p className="text-black/70 text-sm lg:text-base leading-relaxed font-bold">
                      Jelajahi workflow public dan fork untuk dimodifikasi sesuai kebutuhan Anda
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-yellow-300 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:bg-yellow-400 transition-colors">
                  <span className="text-2xl font-black">→</span>
                </div>
              </div>
            </button>

            {/* Option 3 - Import from Knowledge Base */}
            <button
              onClick={() => setMode('topic-import')}
              className="group relative w-full bg-green-300 rounded-xl p-6 lg:p-8
                text-left transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                border-[3px] border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]
                overflow-hidden"
            >
              <div className="relative z-10 flex items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="flex-shrink-0 w-16 h-16 lg:w-20 lg:h-20 bg-white rounded-full flex items-center justify-center border-[3px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <span className="text-4xl lg:text-5xl">🤖</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl lg:text-3xl font-black text-black mb-2">
                      Import dari Materi
                    </h3>
                    <p className="text-black/70 text-sm lg:text-base leading-relaxed font-bold">
                      AI otomatis membuat workflow dari topik di knowledge base dengan struktur optimal
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-yellow-300 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:bg-yellow-400 transition-colors">
                  <span className="text-2xl font-black">→</span>
                </div>
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
      <div className="min-h-screen bg-blue-100">
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
      <div className="h-screen flex flex-col bg-blue-100">
        {/* Header */}
        <header className="bg-white border-b-[3px] border-black px-6 py-4 flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMode('entry')}
              className="px-4 py-2 bg-blue-300 text-black font-black border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
            >
              ← Kembali
            </button>
            <div className="h-6 w-px bg-black" />
            <h1 className="text-xl font-black text-black">
              🎓 Learning Path Builder
            </h1>
            {forkedWorkflow && (
              <span className="text-xs bg-blue-300 text-black px-3 py-1 rounded-full border-2 border-black font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                Forked from: {forkedWorkflow.title}
              </span>
            )}
          </div>
          <div className="text-sm text-black font-bold">
            Topik: <span className="font-black">
              {selectedTopic.title.length > 20
                ? selectedTopic.title.substring(0, 20) + '...'
                : selectedTopic.title}
            </span>
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
