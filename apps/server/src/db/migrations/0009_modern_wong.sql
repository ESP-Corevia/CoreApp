CREATE TABLE "doctors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"specialty" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"image_url" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX "doctors_specialty_idx" ON "doctors" USING btree ("specialty");--> statement-breakpoint
CREATE INDEX "doctors_city_idx" ON "doctors" USING btree ("city");--> statement-breakpoint
CREATE INDEX "doctors_name_idx" ON "doctors" USING btree ("name");