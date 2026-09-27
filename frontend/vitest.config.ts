import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // index.ts only wires the app to a port and runs startup side effects;
      // app.ts (what it serves) is covered by the route tests.
      exclude: ['src/**/*.test.ts', 'src/index.ts'],
      reporter: ['text-summary', 'text'],
    },
    include: ['test/unit/**/*.test.ts'],
    // Browser-side modules read `document` at import time.
    environment: 'happy-dom',
  },
});
