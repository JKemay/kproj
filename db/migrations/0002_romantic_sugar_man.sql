CREATE TYPE "public"."group_kind" AS ENUM('group', 'soloist', 'topic');--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "kind" "group_kind" DEFAULT 'group' NOT NULL;--> statement-breakpoint
UPDATE "groups" SET "kind" = 'topic' WHERE "id" IN ('nl', 'futa');--> statement-breakpoint
UPDATE "groups" SET "kind" = 'soloist' WHERE "id" IN ('somi', 'yena');
