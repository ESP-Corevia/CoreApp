import { tool } from 'ai';
import { z } from 'zod';
import type { AICaller } from '../caller';

export function createPatientTools(caller: AICaller) {
  return {
    // -----------------------------------------------------------------------
    // Appointments
    // -----------------------------------------------------------------------

    get_my_appointments: tool({
      description: 'Get the list of my appointments. Optionally filter by status.',
      inputSchema: z.object({
        status: z
          .enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'])
          .nullish()
          .describe('Filter by appointment status'),
      }),
      execute: async args => {
        return await caller.appointments.listMine({
          status: args.status ?? undefined,
          page: 1,
          limit: 10,
          sort: 'dateDesc',
        });
      },
    }),

    get_appointment_detail: tool({
      description: 'Get the full details of one of my appointments by its ID.',
      inputSchema: z.object({
        id: z.string().describe('The appointment ID'),
      }),
      execute: async args => {
        return await caller.appointments.detail({ id: args.id });
      },
    }),

    create_appointment: tool({
      description:
        'Book a new appointment with a doctor. The slot must be in the future and available.',
      needsApproval: true,
      inputSchema: z.object({
        doctorId: z.string().describe('The doctor to book with'),
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .describe('Appointment date (YYYY-MM-DD)'),
        time: z
          .string()
          .regex(/^\d{2}:\d{2}$/)
          .describe('Appointment time (HH:mm)'),
        reason: z.string().optional().describe('Reason for the appointment'),
      }),
      execute: async args => {
        return await caller.appointments.create({
          doctorId: args.doctorId,
          date: args.date,
          time: args.time,
          reason: args.reason,
        });
      },
    }),

    // -----------------------------------------------------------------------
    // Doctors
    // -----------------------------------------------------------------------

    list_doctors: tool({
      description:
        'Search for bookable doctors. Optionally filter by specialty, city, or free-text search. Returns each doctor with a single `doctorId` field — always reuse THIS value as the `doctorId` in `get_available_slots` and `create_appointment`.',
      inputSchema: z.object({
        specialty: z.string().optional().describe('Filter by specialty'),
        city: z.string().optional().describe('Filter by city'),
        search: z.string().optional().describe('Free-text search on doctor name'),
      }),
      execute: async args => {
        const result = await caller.doctors.list({
          specialty: args.specialty,
          city: args.city,
          search: args.search,
          page: 1,
          limit: 10,
        });
        return {
          ...result,
          items: result.items.map(d => ({
            doctorId: d.userId,
            name: d.name,
            specialty: d.specialty,
            address: d.address,
            city: d.city,
            verified: d.verified,
          })),
        };
      },
    }),

    get_available_slots: tool({
      description:
        'Get available appointment slots for a doctor on a given date. Returns 30-minute time slots. Pass the exact `doctorId` returned by `list_doctors`, NOT any other id.',
      inputSchema: z.object({
        doctorId: z.string().describe('The doctorId value from a previous list_doctors result'),
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .describe('Date to check (YYYY-MM-DD), must be today or later'),
      }),
      execute: async args => {
        return await caller.doctors.availableSlots({
          doctorId: args.doctorId,
          date: args.date,
        });
      },
    }),

    // -----------------------------------------------------------------------
    // Medications search
    // -----------------------------------------------------------------------

    search_medications: tool({
      description: 'Search the medications database by name or active substance.',
      inputSchema: z.object({
        query: z.string().describe('Medication name or substance to search for'),
      }),
      execute: async args => {
        return await caller.medications.search({ query: args.query });
      },
    }),

    // -----------------------------------------------------------------------
    // Pillbox
    // -----------------------------------------------------------------------

    get_my_today_pillbox: tool({
      description: 'Get my medication schedule for today — what I need to take and when.',
      inputSchema: z.object({}),
      execute: async () => {
        return await caller.pillbox.today({});
      },
    }),

    list_my_medications: tool({
      description: 'List all my medications in my pillbox.',
      inputSchema: z.object({
        isActive: z.boolean().optional().describe('Filter by active status only'),
      }),
      execute: async args => {
        return await caller.pillbox.listMine({
          page: 1,
          limit: 20,
          isActive: args.isActive,
        });
      },
    }),

    get_medication_detail: tool({
      description: 'Get details of a specific medication including its intake schedules.',
      inputSchema: z.object({
        id: z.string().describe('The medication ID'),
      }),
      execute: async args => {
        return await caller.pillbox.detail({ id: args.id });
      },
    }),

    mark_intake_taken: tool({
      description: 'Mark a medication intake as taken.',
      needsApproval: true,
      inputSchema: z.object({
        id: z.string().describe('The intake ID'),
        notes: z.string().optional().describe('Optional notes'),
      }),
      execute: async args => {
        return await caller.pillbox.markIntakeTaken({
          id: args.id,
          notes: args.notes,
        });
      },
    }),

    mark_intake_skipped: tool({
      description: 'Mark a medication intake as skipped.',
      needsApproval: true,
      inputSchema: z.object({
        id: z.string().describe('The intake ID'),
        notes: z.string().optional().describe('Optional reason for skipping'),
      }),
      execute: async args => {
        return await caller.pillbox.markIntakeSkipped({
          id: args.id,
          notes: args.notes,
        });
      },
    }),
  };
}
