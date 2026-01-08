'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface Material {
  id: number;
  title: string;
  topicId: number;
  topicName: string;
  description?: string;
  questionsCount: number;
  isCompleted?: boolean;
  userScore?: number;
  userXP?: number;
}

interface MaterialSelectorProps {
  topicId: number;
  topicName: string;
  userId: string; // UUID
  onSelectMaterial: (material: Material) => void;
  onBack?: () => void;
}

export default function MaterialSelector({
  topicId,
  topicName,
  userId,
  onSelectMaterial,
  onBack,
}: MaterialSelectorProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (topicId) params.append('topicId', topicId.toString());
      if (userId) params.append('userId', userId);

      const response = await fetch(`/api/materials?${params.toString()}`);

      // Check if response is ok
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', response.status, response.statusText);
        console.error('Error details:', errorData);
        setMaterials([]);
        return;
      }

      // Check content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Invalid content type:', contentType);
        setMaterials([]);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setMaterials(data.materials);
      } else {
        console.error('Error fetching materials:', data.error);
        setMaterials([]);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  }, [topicId, userId]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading materials...</p>
        </div>
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">No Materials Available</h3>
          <p className="text-gray-500">
            There are no materials available for quiz yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button and breadcrumb */}
      {onBack && (
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium transition"
        >
          <span>←</span> Back to Topics
        </button>
      )}

      <div className="mb-8 text-center">
        <div className="text-sm text-blue-600 font-semibold mb-2">
          {topicName}
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Choose a Material to Quiz
        </h2>
        <p className="text-gray-600">
          Select any material below to test your knowledge
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {materials.map((material, index) => (
          <motion.div
            key={material.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden border border-gray-100"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-1">
                    {material.title}
                  </h3>
                  <p className="text-sm text-blue-600 font-medium">
                    {material.topicName}
                  </p>
                </div>
                {material.isCompleted && (
                  <div className="flex-shrink-0 ml-3">
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                      ✓ Completed
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {material.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {material.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 mb-4 text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                  <span>📝</span>
                  <span>{material.questionsCount} questions</span>
                </div>
                {material.isCompleted && (
                  <>
                    <div className="flex items-center gap-1 text-green-600">
                      <span>✓</span>
                      <span>{material.userScore}/3</span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-600">
                      <span>⭐</span>
                      <span>+{material.userXP} XP</span>
                    </div>
                  </>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => onSelectMaterial(material)}
                className={`w-full py-3 rounded-lg font-semibold transition ${
                  material.isCompleted
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                }`}
              >
                {material.isCompleted ? 'Retake Quiz' : 'Start Quiz'} →
              </button>
            </div>

            {/* Progress bar for completed */}
            {material.isCompleted && material.userScore !== undefined && (
              <div className="h-2 bg-gray-100">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(material.userScore / material.questionsCount) * 100}%`,
                  }}
                  className="h-full bg-gradient-to-r from-green-400 to-green-600"
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-600">
              {materials.length}
            </div>
            <div className="text-sm text-gray-600">Total Materials</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600">
              {materials.filter((m) => m.isCompleted).length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600">
              {materials.reduce((sum, m) => sum + (m.userXP || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total XP</div>
          </div>
        </div>
      </div>
    </div>
  );
}