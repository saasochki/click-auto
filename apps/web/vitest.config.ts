import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Unit tests of pure logic (form model, URL helpers). UI is checked in the browser.
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { include: ['src/**/*.spec.ts'], environment: 'node' },
});
