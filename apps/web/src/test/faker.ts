import { faker } from '@faker-js/faker';

export const mockUser = {
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  createdAt: String(faker.date.past()),
  updatedAt: null,
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  image: null,
  lastLoginMethod: 'email',
  emailVerified: true,
  role: 'user',
  banned: false,
};
