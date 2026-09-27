import { defineConfig } from 'vitest/config';

// Vitest 3+ no longer excludes dist/ by default, and `npm run build` compiles
// the *.test.ts files there too -- run only the TypeScript sources.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});
