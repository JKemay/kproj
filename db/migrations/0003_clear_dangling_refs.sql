-- Data fix: clear profile/cover references whose media row no longer exists.
-- (The validate Lambda's early delete path removed media rows without
-- clearing these refs; the Lambda is fixed, this cleans what already dangled.)
UPDATE "members" SET "profile_media_key" = NULL
WHERE "profile_media_key" IS NOT NULL
  AND "profile_media_key" NOT IN (SELECT "s3_key" FROM "media");--> statement-breakpoint
UPDATE "groups" SET "cover_media_key" = NULL
WHERE "cover_media_key" IS NOT NULL
  AND "cover_media_key" NOT IN (SELECT "s3_key" FROM "media");
