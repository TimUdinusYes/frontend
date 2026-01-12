'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import QuizGame from './components/QuizGame';
import MaterialSelector from './components/MaterialSelector';
import TopicSelector from './components/TopicSelector';
import LevelDisplay from './components/LevelDisplay';
import LoadingSpinner from '@/components/LoadingSpinner';
import FeatureHamburgerOnly from '@/components/FeatureHamburgerOnly';

interface Material {
  id: number;
  title: string;
  topikId: number;
  topikName: string;
  description?: string;
  questionsCount: number;
  isCompleted?: boolean;
  userScore?: number;
  userXP?: number;
}

export default function GamesPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<{ id: number; name: string } | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  // Get authenticated user
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        setUserId(user.id);
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleQuizComplete = (score: number, totalXP: number) => {
    console.log('Quiz completed!', { score, totalXP });

    // Show material selector again after a delay
    setTimeout(() => {
      setSelectedMaterial(null);
    }, 3000);
  };

  const handleBackToMaterials = () => {
    setSelectedMaterial(null);
  };

  const handleBackToTopics = () => {
    setSelectedTopic(null);
    setSelectedMaterial(null);
  };

  const handleSelectTopic = (topicId: number, topicName: string) => {
    setSelectedTopic({ id: topicId, name: topicName });
  };

  const handleSelectMaterial = (material: any) => {
    setSelectedMaterial(material);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-100">
        <FeatureHamburgerOnly />
        <LoadingSpinner text="Loading..." />
      </div>
    );
  }

  if (!userId) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-blue-100 relative">
      <FeatureHamburgerOnly />
      <div className="px-8 pt-20 pb-8">
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Back Button - Show when on topic selection */}
          {!selectedTopic && !selectedMaterial && (
            <button
              onClick={() => router.back()}
              className="mb-6 flex items-center gap-2 px-4 py-2 bg-white text-black font-black border-2 border-black rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali
            </button>
          )}

          <div className="mb-8 text-center">
            <h1 className="text-5xl font-black text-black mb-3">
              Quiz Game
            </h1>
            <p className="text-black/70 text-lg font-bold">
              Test your knowledge and earn XP!
            </p>
          </div>

          {/* Level Display - Only show when not in quiz */}
          {!selectedMaterial && (
            <div className="mb-8 max-w-5xl mx-auto">
              <LevelDisplay userId={userId} compact />
            </div>
          )}

          {selectedMaterial ? (
            <div>
              <button
                onClick={handleBackToMaterials}
                className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-white text-black font-black border-2 border-black rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              >
                <span>←</span> Back to Materials
              </button>
              <QuizGame
                materiId={selectedMaterial.id}
                materiTitle={selectedMaterial.title}
                userId={userId}
                onComplete={handleQuizComplete}
                onBack={handleBackToMaterials}
              />
            </div>
          ) : selectedTopic ? (
            <MaterialSelector
              topicId={selectedTopic.id}
              topicName={selectedTopic.name}
              userId={userId}
              onSelectMaterial={handleSelectMaterial}
              onBack={handleBackToTopics}
            />
          ) : (
            <TopicSelector
              userId={userId}
              onSelectTopic={handleSelectTopic}
            />
          )}
        </div>
      </div>
    </div>
  );
}