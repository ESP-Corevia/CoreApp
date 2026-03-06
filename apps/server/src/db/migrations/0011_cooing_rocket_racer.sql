ALTER TABLE "doctors" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "doctors_user_id_idx" ON "doctors" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_user_id_unique" UNIQUE("user_id");