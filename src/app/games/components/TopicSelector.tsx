'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Topic {
  id: number;
  title: string;
  description?: string;
  materialsCount: number;
  completedCount: number;
  totalXP: number;
}

interface TopicSelectorProps {
  userId: string;
  onSelectTopic: (topicId: number, topicName: string) => void;
}

export default function TopicSelector({
  userId,
  onSelectTopic,
}: TopicSelectorProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopics();
  }, [userId]);

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);

      const response = await fetch(`/api/topics?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', response.status, response.statusText);
        console.error('Error details:', errorData);
        setTopics([]);
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Invalid content type:', contentType);
        setTopics([]);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setTopics(data.topics);
      } else {
        console.error('Error fetching topics:', data.error);
        setTopics([]);
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading topics...</p>
        </div>
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">No Topics Available</h3>
          <p className="text-gray-500">
            There are no topics available for quiz yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Choose a Topic
        </h2>
        <p className="text-gray-600">
          Select a topic to see available materials and quizzes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {topics.map((topic, index) => {
          const progressPercentage = topic.materialsCount > 0
            ? Math.round((topic.completedCount / topic.materialsCount) * 100)
            : 0;

          return (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelectTopic(topic.id, topic.title)}
              className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all cursor-pointer overflow-hidden border border-gray-100 hover:border-blue-300 group"
            >
              <div className="p-6">
                {/* Header */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition">
                    {topic.title}
                  </h3>
                  {topic.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {topic.description}
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                      📚 Materials
                    </span>
                    <span className="font-semibold text-gray-800">
                      {topic.materialsCount}
                    </span>
                  </div>

                  {topic.completedCount > 0 && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          ✓ Completed
                        </span>
                        <span className="font-semibold text-green-600">
                          {topic.completedCount}/{topic.materialsCount}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          ⭐ Total XP
                        </span>
                        <span className="font-semibold text-blue-600">
                          {topic.totalXP}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Progress bar */}
                {topic.materialsCount > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{progressPercentage}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      />
                    </div>
                  </div>
                )}

                {/* Button */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-blue-600 font-semibold group-hover:text-blue-700 transition">
                    <span>View Materials</span>
                    <span className="transform group-hover:translate-x-1 transition">→</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-600">
              {topics.length}
            </div>
            <div className="text-sm text-gray-600">Total Topics</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600">
              {topics.reduce((sum, t) => sum + t.completedCount, 0)}
            </div>
            <div className="text-sm text-gray-600">Quizzes Completed</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600">
              {topics.reduce((sum, t) => sum + t.totalXP, 0)}
            </div>
            <div className="text-sm text-gray-600">Total XP Earned</div>
          </div>
        </div>
      </div>
    </div>
  );
}
