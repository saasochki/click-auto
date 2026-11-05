import { feedRoute } from '../../feed-route';

const { generateMetadata, Page } = feedRoute('service');

export { generateMetadata };
export default Page;

// Place comes from a cookie and filters from the query: always rendered per request.
export const dynamic = 'force-dynamic';
