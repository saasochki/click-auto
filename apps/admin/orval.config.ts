import { defineConfig } from 'orval';

// Admin uses only admin-* tags. Generated files are never edited by hand.
export default defineConfig({
  admin: {
    input: {
      target: '../../packages/api-contract/openapi.json',
      filters: { tags: [/^admin-/] },
    },
    output: {
      mode: 'tags-split',
      target: 'src/api/generated/endpoints',
      schemas: 'src/api/generated/model',
      client: 'react-query',
      httpClient: 'fetch',
      clean: true,
      override: {
        mutator: { path: 'src/api/http-client.ts', name: 'httpClient' },
        query: { useQuery: true, signal: true },
      },
    },
  },
});
