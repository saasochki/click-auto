import { defineConfig } from 'orval';

// The site uses every tag except admin-*. Generated files are never edited by hand.
export default defineConfig({
  web: {
    input: {
      target: '../../packages/api-contract/openapi.json',
      filters: { mode: 'exclude', tags: [/^admin-/] },
    },
    output: {
      mode: 'tags-split',
      target: 'src/shared/api/generated',
      schemas: 'src/shared/api/generated/model',
      client: 'react-query',
      httpClient: 'fetch',
      clean: true,
      override: {
        mutator: { path: 'src/shared/api/http-client.ts', name: 'httpClient' },
        query: { useQuery: true, useSuspenseQuery: true, useInfinite: false },
      },
    },
  },
});
