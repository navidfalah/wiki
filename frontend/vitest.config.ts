import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/unit/**/*.test.ts'],
    // Browser-side modules read `document` at import time.
    environment: 'happy-dom',
  },
});
