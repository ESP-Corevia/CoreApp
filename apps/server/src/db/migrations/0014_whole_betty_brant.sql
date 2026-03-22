CREATE TYPE "public"."intake_moment" AS ENUM('MORNING', 'NOON', 'EVENING', 'BEDTIME', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."intake_status" AS ENUM('PENDING', 'TAKEN', 'SKIPPED');--> statement-breakpoint
CREATE TABLE "patient_medication_intakes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_medication_id" uuid NOT NULL,
	"schedule_id" uuid,
	"scheduled_date" date NOT NULL,
	"scheduled_time" varchar(5) NOT NULL,
	"status" "intake_status" DEFAULT 'PENDING' NOT NULL,
	"taken_at" timestamp,
	"notes" text,
	"created_at" timestamp NOT NULL
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
	"updated_at" timestamp
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
ALTER TABLE "patient_medication_intakes" ADD CONSTRAINT "patient_medication_intakes_patient_medication_id_patient_medications_id_fk" FOREIGN KEY ("patient_medication_id") REFERENCES "public"."patient_medications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_medication_intakes" ADD CONSTRAINT "patient_medication_intakes_schedule_id_patient_medication_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."patient_medication_schedules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_medication_schedules" ADD CONSTRAINT "patient_medication_schedules_patient_medication_id_patient_medications_id_fk" FOREIGN KEY ("patient_medication_id") REFERENCES "public"."patient_medications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_medications" ADD CONSTRAINT "patient_medications_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "patient_medication_intakes_med_date_idx" ON "patient_medication_intakes" USING btree ("patient_medication_id","scheduled_date");--> statement-breakpoint
CREATE INDEX "patient_medication_intakes_status_idx" ON "patient_medication_intakes" USING btree ("scheduled_date","status");--> statement-breakpoint
CREATE INDEX "patient_medication_schedules_med_idx" ON "patient_medication_schedules" USING btree ("patient_medication_id");--> statement-breakpoint
CREATE INDEX "patient_medications_patient_idx" ON "patient_medications" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "patient_medications_active_idx" ON "patient_medications" USING btree ("patient_id","is_active");