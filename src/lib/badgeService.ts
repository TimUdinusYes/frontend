/**
 * Badge Service
 * Handles badge-related operations from the frontend
 */

/**
 * Update user's badge based on their current level
 * @param userId - User ID
 * @returns Updated badge information
 */
export async function updateUserBadge(userId: string) {
  try {
    const response = await fetch("/api/user/update-badge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error("Failed to update badge");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating user badge:", error);
    throw error;
  }
}

/**
 * Get badge for a specific level
 * @param level - Level number
 * @returns Badge information
 */
export async function getBadgeForLevel(level: number) {
  try {
    const response = await fetch(`/api/badges/by-level/${level}`);

    if (!response.ok) {
      throw new Error("Failed to fetch badge");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching badge:", error);
    throw error;
  }
}
