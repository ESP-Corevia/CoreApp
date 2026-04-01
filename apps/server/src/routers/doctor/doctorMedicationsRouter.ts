import {
  GetByCodeInputSchema,
  GetByCodeOutputSchema,
  SearchMedicationsInputSchema,
  SearchMedicationsOutputSchema,
} from '../../lib/medications/medications.schemas';
import { doctorProcedure, router } from '../../middlewares';

export const doctorMedicationsRouter = router({
  search: doctorProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/doctor/medications/search',
        summary: 'Search medications (doctor)',
        description: 'Search the external medications database (BDPM) by name or active substance.',
        tags: ['Doctor Medications'],
      },
    })
    .input(SearchMedicationsInputSchema)
    .output(SearchMedicationsOutputSchema)
    .query(async ({ input, ctx: { services } }) => {
      return await services.medicationsService.search(input);
    }),

  getByCode: doctorProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/doctor/medications/by-code',
        summary: 'Get medication by code (doctor)',
        description:
          'Retrieve a specific medication from the external database by CIS, CIP, or external ID.',
        tags: ['Doctor Medications'],
      },
    })
    .input(GetByCodeInputSchema)
    .output(GetByCodeOutputSchema)
    .query(async ({ input, ctx: { services } }) => {
      return await services.medicationsService.getByCode(input);
    }),
});
