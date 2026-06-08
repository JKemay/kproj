CREATE TABLE "eras" (
	"id" uuid PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"label" text NOT NULL,
	"release_date" date,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "eras_label_length" CHECK (length("eras"."label") BETWEEN 1 AND 100)
);
--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "era_id" uuid;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "tags" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "eras" ADD CONSTRAINT "eras_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_eras_group" ON "eras" USING btree ("group_id");--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_era_id_eras_id_fk" FOREIGN KEY ("era_id") REFERENCES "public"."eras"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_media_era" ON "media" USING btree ("era_id");