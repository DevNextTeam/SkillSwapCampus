-- SkillSwap Campus social migration preflight (READ ONLY)
-- Select the skillswap_campus database before running this script.
-- These queries do not create, update, or delete any data.

-- 1. Check the storage engine used by the existing users table.
SELECT TABLE_NAME, ENGINE, TABLE_COLLATION
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('users', 'skills', 'sessions');

-- 2. Check the exact users.id type and signedness needed by foreign keys.
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, EXTRA
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME = 'id';

-- 3. Check whether the social tables already exist.
SELECT TABLE_NAME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('friend_requests', 'messages');

-- If users is not InnoDB, or users.id is not a compatible INT type,
-- do not run the social migration yet. Share these results for review.
