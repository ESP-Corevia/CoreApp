ALTER TABLE "doctors" ADD COLUMN "verified" boolean DEFAULT false NOT NULL;

DROP VIEW IF EXISTS "public"."doctor_users_view";
CREATE VIEW "public"."doctor_users_view" AS (select "users"."id" as "user_id", "users"."name", "users"."email", "users"."email_verified", "users"."image", "users"."role", "users"."banned", "users"."created_at", "users"."updated_at", "doctors"."id" as "doctor_id", "doctors"."specialty", "doctors"."address" as "doctor_address", "doctors"."city", "doctors"."verified" from "users" inner join "doctors" on "doctors"."user_id" = "users"."id");
