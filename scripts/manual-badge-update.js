/**
 * Manual Badge Update Script
 * Run this to manually trigger badge update for a user
 * Usage: Update USER_ID below and run this script
 */

const USER_ID = "your-user-id-here"; // CHANGE THIS TO YOUR USER ID

async function manualBadgeUpdate() {
  try {
    console.log("🔄 Triggering manual badge update for user:", USER_ID);

    const response = await fetch(
      "http://localhost:3000/api/user/update-badge",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: USER_ID }),
      }
    );

    const result = await response.json();

    if (result.success) {
      console.log("✅ Badge updated successfully!");
      console.log("📊 New Badge Info:");
      console.log("   - Badge ID:", result.badge.id);
      console.log("   - Badge Name:", result.badge.name);
      console.log("   - Badge Image:", result.badge.imageUrl);
      console.log("   - Level:", result.level);
      console.log("   - Level Name:", result.levelName);
    } else {
      console.error("❌ Badge update failed:", result.error);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Also check current stats
async function checkCurrentStats() {
  try {
    console.log("\n📊 Checking current user stats...");

    const response = await fetch(
      `http://localhost:3000/api/user/stats?userId=${USER_ID}`
    );
    const result = await response.json();

    if (result.success) {
      const stats = result.stats;
      console.log("✅ Current Stats:");
      console.log("   - Total XP:", stats.totalXP);
      console.log("   - Level:", stats.level);
      console.log("   - Level Name:", stats.levelName);
      console.log("   - Current Badge:", stats.badge?.name || "No badge");
      console.log("   - Badge ID:", stats.badge?.id || "N/A");
      console.log("   - Badge Image:", stats.badge?.imageUrl || "N/A");
    } else {
      console.error("❌ Failed to fetch stats:", result.error);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Run both
async function run() {
  await checkCurrentStats();
  await manualBadgeUpdate();
  await checkCurrentStats();
}

run();
