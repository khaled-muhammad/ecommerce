CREATE TABLE IF NOT EXISTS "store_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"social" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contact_inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "store_settings" ("id", "social") VALUES (1, '{}'::jsonb)
ON CONFLICT ("id") DO NOTHING;
