ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "first_name" CASCADE;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "last_name" CASCADE;