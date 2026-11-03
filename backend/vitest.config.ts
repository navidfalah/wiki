import { defineConfig } from 'vitest/config';

// Vitest 3+ no longer excludes dist/ by default, and `npm run build` compiles
// the *.test.ts files there too -- run only the TypeScript sources.
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // index.ts only wires the app to a port and runs startup side effects;
      // app.ts (what it serves) is covered by the route tests.
      exclude: ['src/**/*.test.ts', 'src/**/__fixtures__/**', 'src/index.ts'],
      reporter: ['text-summary', 'text'],
    },
    include: ['src/**/*.test.ts'],
  },
});
