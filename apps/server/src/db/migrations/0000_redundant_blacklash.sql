CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TYPE "public"."appointment_status" AS ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."intake_moment" AS ENUM('MORNING', 'NOON', 'EVENING', 'BEDTIME', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."intake_status" AS ENUM('PENDING', 'TAKEN', 'SKIPPED');--> statement-breakpoint
CREATE TYPE "public"."blood_type" AS ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('MALE', 'FEMALE', 'OTHER');--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doctor_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"date" date NOT NULL,
	"time" varchar(5) NOT NULL,
	"status" "appointment_status" DEFAULT 'PENDING' NOT NULL,
	"reason" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "doctor_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doctor_id" uuid NOT NULL,
	"date" date NOT NULL,
	"time" varchar(5) NOT NULL,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"role" text,
	"banned" boolean DEFAULT false NOT NULL,
	"ban_reason" text,
	"ban_expires" timestamp,
	"last_login_method" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp,
	"seeded" boolean DEFAULT false,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "doctors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"specialty" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	CONSTRAINT "doctors_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "patient_medication_intakes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_medication_id" uuid NOT NULL,
	"schedule_id" uuid,
	"scheduled_date" date NOT NULL,
	"scheduled_time" varchar(5) NOT NULL,
	"status" "intake_status" DEFAULT 'PENDING' NOT NULL,
	"taken_at" timestamp,
	"notes" text,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "patient_medication_intakes_med_sched_date_uniq" UNIQUE("patient_medication_id","schedule_id","scheduled_date")
);
--> statement-breakpoint
CREATE TABLE "patient_medication_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_medication_id" uuid NOT NULL,
	"weekday" integer,
	"intake_time" varchar(5) NOT NULL,
	"intake_moment" "intake_moment" DEFAULT 'CUSTOM' NOT NULL,
	"quantity" text DEFAULT '1' NOT NULL,
	"unit" text,
	"notes" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "patient_medication_schedules_med_id_uniq" UNIQUE("patient_medication_id","id")
);
--> statement-breakpoint
CREATE TABLE "patient_medications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"medication_external_id" text,
	"source" text DEFAULT 'api-medicaments-fr' NOT NULL,
	"cis" text,
	"cip" text,
	"medication_name" text NOT NULL,
	"medication_form" text,
	"active_substances" jsonb,
	"dosage_label" text,
	"instructions" text,
	"start_date" date NOT NULL,
	"end_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date_of_birth" date NOT NULL,
	"gender" "gender" NOT NULL,
	"phone" text,
	"address" text,
	"blood_type" "blood_type",
	"allergies" text,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	CONSTRAINT "patients_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_blocks" ADD CONSTRAINT "doctor_blocks_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_medication_intakes" ADD CONSTRAINT "patient_medication_intakes_patient_medication_id_patient_medications_id_fk" FOREIGN KEY ("patient_medication_id") REFERENCES "public"."patient_medications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_medication_intakes" ADD CONSTRAINT "patient_medication_intakes_patient_medication_id_schedule_id_patient_medication_schedules_patient_medication_id_id_fk" FOREIGN KEY ("patient_medication_id","schedule_id") REFERENCES "public"."patient_medication_schedules"("patient_medication_id","id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_medication_schedules" ADD CONSTRAINT "patient_medication_schedules_patient_medication_id_patient_medications_id_fk" FOREIGN KEY ("patient_medication_id") REFERENCES "public"."patient_medications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_medications" ADD CONSTRAINT "patient_medications_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointments_doctor_date_idx" ON "appointments" USING btree ("doctor_id","date");--> statement-breakpoint
CREATE INDEX "appointments_patient_idx" ON "appointments" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "appointments_status_idx" ON "appointments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "doctor_blocks_doctor_date_idx" ON "doctor_blocks" USING btree ("doctor_id","date");--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "token_idx" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verifications" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "doctors_specialty_idx" ON "doctors" USING btree ("specialty");--> statement-breakpoint
CREATE INDEX "doctors_city_idx" ON "doctors" USING btree ("city");--> statement-breakpoint
CREATE INDEX "doctors_user_id_idx" ON "doctors" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "patient_medication_intakes_med_date_idx" ON "patient_medication_intakes" USING btree ("patient_medication_id","scheduled_date");--> statement-breakpoint
CREATE INDEX "patient_medication_intakes_status_idx" ON "patient_medication_intakes" USING btree ("scheduled_date","status");--> statement-breakpoint
CREATE INDEX "patient_medication_schedules_med_idx" ON "patient_medication_schedules" USING btree ("patient_medication_id");--> statement-breakpoint
CREATE INDEX "patient_medications_patient_idx" ON "patient_medications" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "patient_medications_active_idx" ON "patient_medications" USING btree ("patient_id","is_active");--> statement-breakpoint
CREATE INDEX "patient_medications_name_idx" ON "patient_medications" USING btree ("medication_name");--> statement-breakpoint
CREATE INDEX "patients_user_id_idx" ON "patients" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "patients_dob_idx" ON "patients" USING btree ("date_of_birth");