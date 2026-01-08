import type { ActivityStats } from "./activityTracker";

export interface AIInsight {
  type: "strength" | "weakness" | "recommendation" | "pattern";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export interface MasteredConcept {
  concept: string;
  confidence: number;
  evidence: string;
}

export interface LearningConcept {
  concept: string;
  progress: number;
  needsReview: boolean;
  estimatedTimeToMaster: string;
  status: string; // Status detail: "Belum mengerjakan quiz", "Quiz belum sempurna", dll
}

export interface NotStartedConcept {
  concept: string;
  prerequisite: string[];
  difficulty: "easy" | "medium" | "hard";
  estimatedLearningTime: string;
  reason: string; // Alasan kenapa belum dimulai
}

export interface KnowledgeMap {
  masteredConcepts: MasteredConcept[];
  learningConcepts: LearningConcept[];
  notStartedConcepts: NotStartedConcept[];
}

export interface LearningVelocity {
  overallSpeed: "slow" | "medium" | "fast";
  fastTopics: string[];
  slowTopics: string[];
  recommendation: string;
}

export interface PredictedChallenge {
  topic: string;
  challenge: string;
  preventionTip: string;
}

export interface LearningPathStep {
  step: number;
  topic: string;
  reason: string;
  estimatedTime: string;
}

export interface LearningAnalysis {
  knowledgeMap: KnowledgeMap;
  learningVelocity: LearningVelocity;
  predictedChallenges: PredictedChallenge[];
  optimalLearningPath: LearningPathStep[];
  insights: AIInsight[];
  studyPattern: string;
  motivationalMessage: string;
  recommendedMaterials: string[];
}

class AIAnalysisService {
  // Analyze user learning patterns and provide insights using API route
  async analyzeLearningPattern(
    stats: ActivityStats
  ): Promise<LearningAnalysis | null> {
    try {
      console.log("🚀 Sending to AI API:", {
        totalMaterials: stats.totalMaterialsOpened,
        materialSummaryCount: stats.materialSummary?.length || 0,
        materialSummary: stats.materialSummary,
      });

      const response = await fetch("/api/AI/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({ stats }),
        cache: "no-store",
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("❌ API returned non-JSON response:", contentType);
        throw new Error("Server returned non-JSON response");
      }

      if (!response.ok) {
        const error = await response.json();
        console.error("❌ API Error:", error);
        throw new Error(error.error || "Failed to analyze");
      }

      const analysis: LearningAnalysis = await response.json();
      console.log("📥 Received from AI:", {
        masteredCount: analysis.knowledgeMap?.masteredConcepts?.length || 0,
        learningCount: analysis.knowledgeMap?.learningConcepts?.length || 0,
        notStartedCount: analysis.knowledgeMap?.notStartedConcepts?.length || 0,
      });
      return analysis;
    } catch (error) {
      console.error("Error analyzing learning pattern:", error);
      return null;
    }
  }

  // Note: Functions below are placeholders for future enhancements
  // They can be implemented as API routes when needed

  async generateStudyRecommendations(
    stats: ActivityStats,
    recentTopics: string[]
  ): Promise<string[]> {
    // TODO: Implement as API route if needed
    console.log("generateStudyRecommendations not yet implemented");
    return [];
  }

  async analyzeStudyTimePattern(activities: any[]): Promise<string> {
    // TODO: Implement as API route if needed
    console.log("analyzeStudyTimePattern not yet implemented");
    return "Fitur ini akan segera tersedia";
  }

  async generateQuizQuestions(
    materialContent: string,
    count: number = 5
  ): Promise<any[]> {
    // TODO: Implement as API route if needed
    console.log("generateQuizQuestions not yet implemented");
    return [];
  }
}

export const aiAnalysis = new AIAnalysisService();