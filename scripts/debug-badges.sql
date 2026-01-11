-- DEBUG: Check badge configuration
SELECT badge_id, nama, gambar, level_min, level_max 
FROM badge 
ORDER BY level_min;

-- DEBUG: Check user profile badge_id
SELECT user_id, badge_id 
FROM user_profiles 
WHERE user_id = 'YOUR_USER_ID_HERE'; -- Replace with actual user ID

-- DEBUG: Check user's total XP and quiz progress
SELECT 
  user_id,
  COUNT(*) as total_quizzes,
  SUM(xp_earned) as total_xp,
  SUM(CASE WHEN is_completed = true THEN 1 ELSE 0 END) as completed_quizzes
FROM user_materials_quiz_progress
WHERE user_id = 'YOUR_USER_ID_HERE' -- Replace with actual user ID
GROUP BY user_id;

-- MANUAL FIX: Update badge for level 2 user
-- Replace 'YOUR_USER_ID_HERE' with actual user ID
UPDATE user_profiles 
SET badge_id = 1  -- Badge 1 is for Level 1-2
WHERE user_id = 'YOUR_USER_ID_HERE';

-- VERIFY: Check if update worked
SELECT up.user_id, up.badge_id, b.nama, b.gambar, b.level_min, b.level_max
FROM user_profiles up
LEFT JOIN badge b ON up.badge_id = b.badge_id
WHERE up.user_id = 'YOUR_USER_ID_HERE';
