ALTER TABLE "appointments" DROP CONSTRAINT "appointments_doctor_id_doctors_id_fk";
--> statement-breakpoint
ALTER TABLE "doctor_blocks" DROP CONSTRAINT "doctor_blocks_doctor_id_doctors_id_fk";
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_blocks" ADD CONSTRAINT "doctor_blocks_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;