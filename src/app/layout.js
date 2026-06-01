import Providers from '@/components/Providers';
import '@/styles/globals.css';

export const metadata = {
  title: 'ElectricVision Track',
  description: 'Platformă de management pentru șantiere electrice — ElectricVision',
  icons: { icon: '/images/logo_profile.png', apple: '/images/logo_profile.png' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
