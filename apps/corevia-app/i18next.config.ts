import { defineConfig } from 'i18next-cli';

export default defineConfig({
  locales: ['en', 'fr'],
  extract: {
    ignore: ['node_modules/**'],
    input: 'src/**/*.{js,jsx,ts,tsx}',
    output: 'src/locales/{{language}}.json',
    functions: ['t', '*.t', 'i18next.t'],
    transComponents: ['Trans', 'Translation'],
  },
});
