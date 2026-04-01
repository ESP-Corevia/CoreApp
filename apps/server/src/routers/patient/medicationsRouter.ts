import {
  GetByCodeInputSchema,
  GetByCodeOutputSchema,
  SearchMedicationsInputSchema,
  SearchMedicationsOutputSchema,
} from '../../lib/medications/medications.schemas';
import { patientProcedure, router } from '../../middlewares';

export const patientMedicationsRouter = router({
  search: patientProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/medications/search',
        summary: 'Search medications',
        description: 'Search the external medications database (BDPM) by name or active substance.',
        tags: ['Medications'],
      },
    })
    .input(SearchMedicationsInputSchema)
    .output(SearchMedicationsOutputSchema)
    .query(async ({ input, ctx: { services } }) => {
      return await services.medicationsService.search(input);
    }),

  getByCode: patientProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/medications/by-code',
        summary: 'Get medication by code',
        description:
          'Retrieve a specific medication from the external database by CIS, CIP, or external ID.',
        tags: ['Medications'],
      },
    })
    .input(GetByCodeInputSchema)
    .output(GetByCodeOutputSchema)
    .query(async ({ input, ctx: { services } }) => {
      return await services.medicationsService.getByCode(input);
    }),
});
