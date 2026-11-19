-- Preserve existing users before changing username uniqueness from per-restaurant
-- to global. The first occurrence keeps the base username; later occurrences
-- receive a stable suffix derived from their user ID.
WITH ranked_users AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY username
      ORDER BY "createdAt", id
    ) AS duplicate_number
  FROM "User"
)
UPDATE "User" AS user_record
SET username = user_record.username || '_' || SUBSTRING(MD5(user_record.id), 1, 8)
FROM ranked_users
WHERE user_record.id = ranked_users.id
  AND ranked_users.duplicate_number > 1;

DROP INDEX "User_restaurantId_username_key";

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
