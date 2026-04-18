import { tool } from 'ai';
import { z } from 'zod';
import type { AICaller } from '../caller';

const YMD = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

export function createDoctorTools(caller: AICaller) {
  return {
    // -----------------------------------------------------------------------
    // Appointments
    // -----------------------------------------------------------------------

    get_my_appointments: tool({
      description:
        'Get the list of my appointments as a doctor. Optionally filter by status and/or a date range (YYYY-MM-DD).',
      inputSchema: z.object({
        status: z
          .enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'])
          .nullish()
          .describe('Filter by appointment status'),
        from: YMD.nullish().describe('Only include appointments on or after this date'),
        to: YMD.nullish().describe('Only include appointments on or before this date'),
        sort: z
          .enum(['dateAsc', 'dateDesc', 'createdAtDesc'])
          .nullish()
          .describe('Sort order (default: dateDesc)'),
      }),
      execute: async args => {
        return await caller.doctor.appointments.listMine({
          status: args.status ?? undefined,
          from: args.from ?? undefined,
          to: args.to ?? undefined,
          sort: args.sort ?? 'dateDesc',
          page: 1,
          limit: 20,
        });
      },
    }),

    get_appointment_detail: tool({
      description: 'Get the full details of one of my appointments by its ID.',
      inputSchema: z.object({
        id: z.string().describe('The appointment ID'),
      }),
      execute: async args => {
        return await caller.doctor.appointments.detail({ id: args.id });
      },
    }),

    update_appointment_status: tool({
      description:
        'Update the status of an appointment (confirm a pending one, complete a confirmed one, or cancel it).',
      needsApproval: true,
      inputSchema: z.object({
        id: z.string().describe('The appointment ID'),
        status: z.enum(['CONFIRMED', 'COMPLETED', 'CANCELLED']).describe('The new status'),
      }),
      execute: async args => {
        return await caller.doctor.appointments.updateStatus({
          id: args.id,
          status: args.status,
        });
      },
    }),

    // -----------------------------------------------------------------------
    // Patient pillbox (requires an existing doctor/patient relationship)
    // -----------------------------------------------------------------------

    list_patient_medications: tool({
      description:
        "List a patient's medications. The patientId is the patient's user ID. Optionally filter to only active medications.",
      inputSchema: z.object({
        patientId: z.string().describe('The patient user ID'),
        isActive: z.boolean().optional().describe('Only include active medications'),
      }),
      execute: async args => {
        return await caller.doctor.pillbox.listByPatient({
          patientId: args.patientId,
          isActive: args.isActive,
          page: 1,
          limit: 50,
        });
      },
    }),

    get_patient_today_pillbox: tool({
      description:
        "Get a patient's medication schedule for today — what they need to take and when, and the status of each intake.",
      inputSchema: z.object({
        patientId: z.string().describe('The patient user ID'),
      }),
      execute: async args => {
        return await caller.doctor.pillbox.todayByPatient({
          patientId: args.patientId,
        });
      },
    }),

    get_patient_intake_history: tool({
      description:
        "Get a patient's medication intake adherence history across a date range, with each intake's medication name, scheduled time, status and notes. Useful for reviewing adherence.",
      inputSchema: z.object({
        patientId: z.string().describe('The patient user ID'),
        from: YMD.describe('Start of the range (YYYY-MM-DD, inclusive)'),
        to: YMD.describe('End of the range (YYYY-MM-DD, inclusive)'),
      }),
      execute: async args => {
        return await caller.doctor.pillbox.intakeHistory({
          patientId: args.patientId,
          from: args.from,
          to: args.to,
        });
      },
    }),

    get_patient_medication_detail: tool({
      description:
        'Get the full detail of a patient medication (including its schedules) by the medication ID.',
      inputSchema: z.object({
        id: z.string().describe('The patient-medication ID'),
      }),
      execute: async args => {
        return await caller.doctor.pillbox.medicationDetail({ id: args.id });
      },
    }),

    // -----------------------------------------------------------------------
    // Medications reference database (BDPM)
    // -----------------------------------------------------------------------

    search_medications: tool({
      description:
        'Search the reference medications database (BDPM) by name or active substance. Use this to look up dosages, forms, active substances, or reimbursement info before discussing with a patient.',
      inputSchema: z.object({
        query: z.string().min(3).describe('Medication name or active substance (min 3 characters)'),
      }),
      execute: async args => {
        return await caller.doctor.medications.search({
          query: args.query,
          page: 1,
          limit: 20,
        });
      },
    }),

    get_medication_by_code: tool({
      description:
        'Retrieve a specific medication from the reference database by CIS code, CIP code, or external ID.',
      inputSchema: z
        .object({
          cis: z.string().optional().describe('CIS code'),
          cip: z.string().optional().describe('CIP code'),
          externalId: z.string().optional().describe('External ID'),
        })
        .refine(v => v.cis || v.cip || v.externalId, {
          message: 'Provide at least one of cis, cip, or externalId',
        }),
      execute: async args => {
        return await caller.doctor.medications.getByCode(args);
      },
    }),
  };
}
