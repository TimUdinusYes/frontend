import { supabase } from "@/lib/supabase";

export interface MaterialActivity {
  id: string;
  user_id: string;
  material_id: string;
  material_title: string;
  topic_title: string;
  opened_at: string;
  duration_seconds: number;
  completed: boolean;
}

export interface ActivityStats {
  totalMaterialsOpened: number;
  totalTimeSpent: number; // in minutes
  materialsCompleted: number;
  averageSessionTime: number; // in minutes
  mostViewedMaterials: { material_id: string; title: string; count: number }[];
  recentActivities: MaterialActivity[];
  materialSummary: Array<{
    material_title: string;
    topic_title: string;
    total_opens: number;
    total_duration: number;
    is_completed: boolean;
  }>;
  // Quiz data for hybrid analysis
  materialQuizSummary: Array<{
    material_id: number;
    material_title: string;
    topic_title: string;
    total_correct: number;
    total_answered: number;
    total_pages: number;
    // Activity data merged
    total_opens: number;
    total_duration: number;
    is_completed: boolean;
  }>;
}

class ActivityTrackerService {
  private currentSession: {
    material_id: string;
    started_at: Date;
  } | null = null;

  // Track when user opens a material
  async startSession(
    materialId: string,
    materialTitle: string,
    topicTitle: string
  ) {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("❌ Auth error:", authError);
        return;
      }

      if (!user) {
        console.warn("⚠️ No user logged in, skipping tracking");
        return;
      }

      console.log("📝 Starting tracking session for user:", user.id);

      this.currentSession = {
        material_id: materialId,
        started_at: new Date(),
      };

      // Record activity in database
      const { data, error } = await supabase
        .from("material_activities")
        .insert({
          user_id: user.id,
          material_id: materialId,
          material_title: materialTitle,
          topic_title: topicTitle,
          opened_at: new Date().toISOString(),
          duration_seconds: 0,
          completed: false,
        })
        .select();

      if (error) {
        console.error("❌ Error tracking activity:", error);
        console.error("Error type:", typeof error);
        console.error("Error keys:", Object.keys(error));

        // Try to log all error properties
        try {
          console.error("Full error object:", JSON.stringify(error, null, 2));
        } catch (e) {
          console.error("Could not stringify error");
        }

        // Show user-friendly error message
        if (error.message) {
          console.error("Error message:", error.message);
        }
        if (error.code === "42P01") {
          console.error(
            "❌ Tabel material_activities belum dibuat! Silakan jalankan schema.sql di Supabase"
          );
        } else if (error.code === "42501") {
          console.error(
            "❌ RLS policy error! User mungkin belum login atau policy belum dikonfigurasi"
          );
        } else if (error.code === "PGRST116") {
          console.error(
            '❌ RLS policy menolak INSERT! Pastikan policy "Users can insert own material activities" sudah dibuat'
          );
        }
      } else {
        console.log("✅ Activity tracked successfully:", {
          materialId,
          materialTitle,
          topicTitle,
          recordId: data?.[0]?.id,
        });
      }
    } catch (err) {
      console.error("❌ Unexpected error in startSession:", err);
    }
  }

  // Track when user leaves or completes a material
  async endSession(completed: boolean = false) {
    if (!this.currentSession) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const durationSeconds = Math.floor(
      (new Date().getTime() - this.currentSession.started_at.getTime()) / 1000
    );

    // First, get the latest activity record
    const { data: latestActivity, error: fetchError } = await supabase
      .from("material_activities")
      .select("id")
      .eq("user_id", user.id)
      .eq("material_id", this.currentSession.material_id)
      .order("opened_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError) {
      console.error("Error fetching latest activity:", fetchError);
      console.error("Error details:", {
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint,
        code: fetchError.code,
      });
      this.currentSession = null;
      return;
    }

    // Then update it
    const { error: updateError } = await supabase
      .from("material_activities")
      .update({
        duration_seconds: durationSeconds,
        completed: completed,
      })
      .eq("id", latestActivity.id);

    if (updateError) {
      console.error("Error updating activity:", updateError);
      console.error("Error details:", {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code,
      });
    } else {
      console.log("✅ Activity updated successfully:", {
        duration: durationSeconds,
        completed: completed,
      });
    }

    this.currentSession = null;
  }

  // Get user activity statistics
  async getActivityStats(): Promise<ActivityStats | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    try {
      // Get all activities
      const { data: activities, error } = await supabase
        .from("material_activities")
        .select("*")
        .eq("user_id", user.id)
        .order("opened_at", { ascending: false });

      if (error) throw error;
      if (!activities) return null;

      // Calculate statistics
      const totalMaterialsOpened = new Set(activities.map((a) => a.material_id))
        .size;
      const totalTimeSpent =
        activities.reduce((sum, a) => sum + (a.duration_seconds || 0), 0) / 60;
      const materialsCompleted = activities.filter((a) => a.completed).length;
      const averageSessionTime =
        activities.length > 0 ? totalTimeSpent / activities.length : 0;

      // Get most viewed materials
      const materialCounts = activities.reduce((acc, activity) => {
        const key = activity.material_id;
        if (!acc[key]) {
          acc[key] = {
            material_id: activity.material_id,
            title: activity.material_title,
            count: 0,
          };
        }
        acc[key].count++;
        return acc;
      }, {} as Record<string, { material_id: string; title: string; count: number }>);

      const mostViewedMaterials = Object.values(materialCounts)
        .sort(
          (a, b) =>
            (b as { count: number }).count - (a as { count: number }).count
        )
        .slice(0, 5) as { material_id: string; title: string; count: number }[];

      // Get recent activities
      const recentActivities = activities.slice(0, 10);

      // Create material summary with completion status
      const materialSummaryMap = activities.reduce((acc, activity) => {
        const key = activity.material_id;
        if (!acc[key]) {
          acc[key] = {
            material_title: activity.material_title,
            topic_title: activity.topic_title,
            total_opens: 0,
            total_duration: 0,
            is_completed: false,
          };
        }
        acc[key].total_opens++;
        acc[key].total_duration += activity.duration_seconds || 0;
        // Mark as completed if ANY session was completed
        if (activity.completed) {
          acc[key].is_completed = true;
        }
        return acc;
      }, {} as Record<string, { material_title: string; topic_title: string; total_opens: number; total_duration: number; is_completed: boolean }>);

      const materialSummary = Object.values(materialSummaryMap) as Array<{
        material_title: string;
        topic_title: string;
        total_opens: number;
        total_duration: number;
        is_completed: boolean;
      }>;

      return {
        totalMaterialsOpened,
        totalTimeSpent: Math.round(totalTimeSpent),
        materialsCompleted,
        averageSessionTime: Math.round(averageSessionTime),
        mostViewedMaterials,
        recentActivities,
        materialSummary,
        materialQuizSummary: [], // Empty by default, use getCombinedStats() for quiz data
      };
    } catch (error) {
      console.error("Error fetching activity stats:", error);
      return null;
    }
  }

  // Get combined stats: quiz scores (primary) + learning time (secondary)
  async getCombinedStats(): Promise<ActivityStats | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    try {
      // 1. Get base activity stats
      const baseStats = await this.getActivityStats();
      if (!baseStats) return null;

      // 2. Fetch quiz scores with material and topic info
      const { data: quizScores, error: quizError } = await supabase
        .from("user_material_quiz_scores")
        .select(
          `
          id,
          material_id,
          total_correct,
          total_answered,
          materials (
            id,
            title,
            pages,
            topic_id,
            topics (
              id,
              title
            )
          )
        `
        )
        .eq("user_id", user.id);

      if (quizError) {
        console.error("❌ Error fetching quiz scores:", quizError);
        // Return base stats without quiz data if quiz fetch fails
        return baseStats;
      }

      if (!quizScores || quizScores.length === 0) {
        console.log("📊 No quiz data found, returning activity data only");
        return baseStats;
      }

      // 3. Create activity lookup map
      const activityMap = new Map();
      baseStats.materialSummary.forEach((mat) => {
        activityMap.set(mat.material_title, {
          total_opens: mat.total_opens,
          total_duration: mat.total_duration,
          is_completed: mat.is_completed,
        });
      });

      // 4. Build combined quiz summary with deduplication
      const quizMap = new Map();

      quizScores
        .filter((qs) => qs.materials) // Filter out invalid data
        .forEach((quizScore) => {
          const material = quizScore.materials as any;
          const topic = material?.topics as any;
          const materialTitle = material?.title || "Unknown Material";
          const normalizedTitle = materialTitle.toLowerCase().trim();

          // Get activity data if exists
          const activityData = activityMap.get(materialTitle) || {
            total_opens: 0,
            total_duration: 0,
            is_completed: false,
          };

          const quizData = {
            material_id: quizScore.material_id,
            material_title: materialTitle,
            topic_title: topic?.title || "Unknown Topic",
            total_correct: quizScore.total_correct || 0,
            total_answered: quizScore.total_answered || 0,
            total_pages: Array.isArray(material?.pages)
              ? material.pages.length
              : 0,
            // Merge activity data
            total_opens: activityData.total_opens,
            total_duration: activityData.total_duration,
            is_completed: activityData.is_completed,
          };

          // Deduplicate: keep the highest quiz score for same material
          const existing = quizMap.get(normalizedTitle);
          if (!existing || quizData.total_correct > existing.total_correct) {
            quizMap.set(normalizedTitle, quizData);
          }
        });

      const materialQuizSummary = Array.from(quizMap.values());

      console.log("✅ Combined stats created:", {
        quizMaterials: materialQuizSummary.length,
        activityMaterials: baseStats.materialSummary.length,
      });

      return {
        ...baseStats,
        materialQuizSummary,
      };
    } catch (error) {
      console.error("Error fetching combined stats:", error);
      return null;
    }
  }

  // Get activities for a specific date range
  async getActivitiesByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<MaterialActivity[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("material_activities")
      .select("*")
      .eq("user_id", user.id)
      .gte("opened_at", startDate.toISOString())
      .lte("opened_at", endDate.toISOString())
      .order("opened_at", { ascending: false });

    if (error) {
      console.error("Error fetching activities by date:", error);
      return [];
    }

    return data || [];
  }
}

export const activityTracker = new ActivityTrackerService();