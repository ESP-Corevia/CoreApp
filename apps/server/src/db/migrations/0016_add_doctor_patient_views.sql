CREATE OR REPLACE VIEW "doctor_users_view" AS
SELECT
  "users"."id" AS "user_id",
  "users"."name",
  "users"."email",
  "users"."email_verified",
  "users"."image",
  "users"."role",
  "users"."banned",
  "users"."created_at",
  "users"."updated_at",
  "doctors"."id" AS "doctor_id",
  "doctors"."specialty",
  "doctors"."address" AS "doctor_address",
  "doctors"."city"
FROM "users"
INNER JOIN "doctors" ON "doctors"."user_id" = "users"."id";

CREATE OR REPLACE VIEW "patient_users_view" AS
SELECT
  "users"."id" AS "user_id",
  "users"."name",
  "users"."email",
  "users"."email_verified",
  "users"."image",
  "users"."role",
  "users"."banned",
  "users"."created_at",
  "users"."updated_at",
  "patients"."id" AS "patient_id",
  "patients"."date_of_birth",
  "patients"."gender",
  "patients"."phone",
  "patients"."address" AS "patient_address",
  "patients"."blood_type",
  "patients"."allergies",
  "patients"."emergency_contact_name",
  "patients"."emergency_contact_phone"
FROM "users"
INNER JOIN "patients" ON "patients"."user_id" = "users"."id";
