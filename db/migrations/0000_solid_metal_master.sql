CREATE TYPE "public"."media_kind" AS ENUM('image', 'gif', 'video');--> statement-breakpoint
CREATE TABLE "groups" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"debut_year" integer,
	"agency" text,
	"cover_media_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "groups_name_length" CHECK (length("groups"."name") BETWEEN 1 AND 100),
	CONSTRAINT "groups_debut_year_range" CHECK ("groups"."debut_year" IS NULL OR "groups"."debut_year" BETWEEN 1990 AND 2100),
	CONSTRAINT "groups_agency_length" CHECK ("groups"."agency" IS NULL OR length("groups"."agency") <= 100)
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY NOT NULL,
	"s3_key" text NOT NULL,
	"group_id" text NOT NULL,
	"member_id" text,
	"kind" "media_kind" NOT NULL,
	"caption" text,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"uploaded_by" uuid,
	CONSTRAINT "media_s3_key_unique" UNIQUE("s3_key"),
	CONSTRAINT "media_caption_length" CHECK ("media"."caption" IS NULL OR length("media"."caption") <= 500)
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" text NOT NULL,
	"group_id" text NOT NULL,
	"stage_name" text NOT NULL,
	"position" text,
	"bio" text,
	"profile_media_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "members_group_id_id_pk" PRIMARY KEY("group_id","id"),
	CONSTRAINT "members_stage_name_length" CHECK (length("members"."stage_name") BETWEEN 1 AND 100),
	CONSTRAINT "members_position_length" CHECK ("members"."position" IS NULL OR length("members"."position") <= 100),
	CONSTRAINT "members_bio_length" CHECK ("members"."bio" IS NULL OR length("members"."bio") <= 5000)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"is_allowed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_member_fk" FOREIGN KEY ("group_id","member_id") REFERENCES "public"."members"("group_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_media_group" ON "media" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_media_member" ON "media" USING btree ("group_id","member_id");