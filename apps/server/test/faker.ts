import { faker } from '@faker-js/faker';

export const user = {
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  createdAt: faker.date.past(),
  updatedAt: null,
  image: null,
  lastLoginMethod: 'email',
  emailVerified: true,
  role: 'user',
};
