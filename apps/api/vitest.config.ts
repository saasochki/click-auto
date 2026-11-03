import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// SWC keeps decorator metadata that NestJS dependency injection needs.
export default defineConfig({
  test: { include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'], environment: 'node' },
  plugins: [swc.vite({ module: { type: 'es6' } })],
});
