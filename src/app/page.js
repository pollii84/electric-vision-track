import { headers } from 'next/headers';
import DashboardPage from './DashboardPage';
import MarketingPage from './marketing/page';

export default async function Page() {
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || '';

  // Check if it's the marketing domain
  const isMarketing = host.includes('dimensionvisiontrack.com') && !host.startsWith('app.');

  if (isMarketing) {
    return <MarketingPage />;
  }

  return <DashboardPage />;
}
