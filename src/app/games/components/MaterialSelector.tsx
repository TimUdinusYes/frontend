"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import LoadingSpinner from "@/components/LoadingSpinner";

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
      if (topicId) params.append("topicId", topicId.toString());
      if (userId) params.append("userId", userId);

      const response = await fetch(`/api/materials?${params.toString()}`);

      // Check if response is ok
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error:", response.status, response.statusText);
        console.error("Error details:", errorData);
        setMaterials([]);
        return;
      }

      // Check content type
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Invalid content type:", contentType);
        setMaterials([]);
        return;
      }

      const data = await response.json();

      if (data.success) {
        // Sort materials by ID to ensure consistent ordering for sequential locking
        const sortedMaterials = [...data.materials].sort((a, b) => a.id - b.id);
        setMaterials(sortedMaterials);
      } else {
        console.error("Error fetching materials:", data.error);
        setMaterials([]);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
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
        <LoadingSpinner text="Loading materials..." />
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center bg-yellow-200 rounded-xl border-[3px] border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] p-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-black text-black mb-2">
            No Materials Available
          </h3>
          <p className="text-black/70 font-bold mb-6">
            There are no materials available for quiz yet.
          </p>
          {onBack && (
            <button
              onClick={onBack}
              className="px-6 py-3 bg-white text-black font-black border-2 border-black rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
            >
              ← Back to Topics
            </button>
          )}
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
          className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-white text-black font-black border-2 border-black rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
        >
          <span>←</span> Back to Topics
        </button>
      )}

      <div className="mb-8 text-center">
        <div className="text-sm text-black font-bold mb-2 inline-block px-3 py-1 bg-blue-200 border-2 border-black rounded-full">
          {topicName}
        </div>
        <h2 className="text-3xl font-black text-black mb-2">
          Choose a Material to Quiz
        </h2>
        <p className="text-black/70 font-bold">
          Select any material below to test your knowledge
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {materials.map((material, index) => {
          // Check if this material is locked (requires previous material completion)
          const isLocked = index > 0 && !materials[index - 1]?.isCompleted;
          const previousMaterial = index > 0 ? materials[index - 1] : null;

          return (
            <motion.div
              key={material.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white rounded-xl border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden ${isLocked
                  ? "opacity-60"
                  : "hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]]"
                } transition-all`}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-black mb-1">
                      {material.title}
                    </h3>
                    <p className="text-sm text-black font-bold">
                      {material.topicName}
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-3">
                    {isLocked ? (
                      <div className="bg-red-200 text-black border-2 border-black px-3 py-1 rounded-full text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        🔒 Terkunci
                      </div>
                    ) : material.isCompleted ? (
                      <div className="bg-green-200 text-black border-2 border-black px-3 py-1 rounded-full text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        ✓ Completed
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Lock Message */}
                {isLocked && previousMaterial && (
                  <div className="mb-4 p-3 bg-yellow-100 border-2 border-black rounded-lg">
                    <p className="text-xs text-black font-bold">
                      🔒 Selesaikan{" "}
                      <span className="font-black">
                        &quot;{previousMaterial.title}&quot;
                      </span>{" "}
                      terlebih dahulu
                    </p>
                  </div>
                )}

                {/* Description */}
                {material.description && (
                  <p className="text-black/70 text-sm mb-4 line-clamp-2 font-bold">
                    {material.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-1 text-black font-bold">
                    <span>📝</span>
                    <span>{material.questionsCount} questions</span>
                  </div>
                  {material.isCompleted && (
                    <>
                      <div className="flex items-center gap-1 text-black font-bold">
                        <span>✓</span>
                        <span>{material.userScore}/3</span>
                      </div>
                      <div className="flex items-center gap-1 text-black font-bold">
                        <span>⭐</span>
                        <span>+{material.userXP} XP</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Action Button */}
                <button
                  onClick={() => !isLocked && onSelectMaterial(material)}
                  disabled={isLocked}
                  className={`w-full py-3 rounded-lg font-black border-2 border-black transition-all ${isLocked
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    : material.isCompleted
                      ? "bg-gray-200 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
                      : "bg-blue-500 text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
                    }`}
                >
                  {isLocked
                    ? "🔒 Terkunci"
                    : material.isCompleted
                      ? "Retake Quiz"
                      : "Start Quiz"}{" "}
                  {!isLocked && "→"}
                </button>
              </div>

              {/* Progress bar for completed */}
              {material.isCompleted && material.userScore !== undefined && (
                <div className="h-3 bg-white border-t-2 border-black">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(material.userScore / material.questionsCount) * 100
                        }%`,
                    }}
                    className="h-full bg-yellow-400"
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-12 bg-white rounded-xl border-[3px] border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] p-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl font-black text-black">
              {materials.length}
            </div>
            <div className="text-sm text-black/70 font-bold">
              Total Materials
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-black">
              {materials.filter((m) => m.isCompleted).length}
            </div>
            <div className="text-sm text-black/70 font-bold">Completed</div>
          </div>
          <div>
            <div className="text-3xl font-black text-black">
              {materials.reduce((sum, m) => sum + (m.userXP || 0), 0)}
            </div>
            <div className="text-sm text-black/70 font-bold">Total XP</div>
          </div>
        </div>
      </div>
    </div>
  );
}