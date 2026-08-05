import Script from 'next/script';
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
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-R2BJ2TQ69C"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-R2BJ2TQ69C');
          `}
        </Script>
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

