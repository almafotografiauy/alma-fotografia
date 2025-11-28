import { voga, firaSans, cormorantGaramond } from '@/fonts';
import './globals.css';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { ToastProvider } from '@/components/ui/Toast';
import ImageProtection from '@/components/ImageProtection';

export const metadata = {
  metadataBase: new URL('https://almafotografiauy.com'),
  title: {
    default: 'Alma Fotografía | Fotografía Profesional de Eventos',
    template: '%s | Alma Fotografía'
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  description: 'Alma Fotografía - Capturamos los momentos más especiales de tu vida. Fotografía profesional de bodas, eventos, retratos y sesiones corporativas. Galerías privadas y descarga de fotos en alta calidad.',
  keywords: ['fotografía profesional', 'fotógrafa de bodas', 'fotografía de eventos', 'sesiones fotográficas', 'retratos profesionales', 'fotografía corporativa', 'galerías privadas', 'descargas de fotos'],
  authors: [{ name: 'Alma Fotografía' }],
  creator: 'Alma Fotografía',
  publisher: 'Alma Fotografía',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://almafotografiauy.com',
    title: 'Alma Fotografía | Fotografía Profesional de Eventos',
    description: 'Capturamos los momentos más especiales de tu vida. Fotografía profesional de bodas, eventos y retratos.',
    siteName: 'Alma Fotografía',
    images: [
      {
        url: 'https://res.cloudinary.com/dav2dvukf/image/upload/c_scale,w_400/b_rgb:2D2D2D,c_pad,g_center,h_630,w_1200/alma-fotografia/logo-og.png',
        width: 1200,
        height: 630,
        alt: 'Alma Fotografía - Fotografía Profesional',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alma Fotografía | Fotografía Profesional de Eventos',
    description: 'Capturamos los momentos más especiales de tu vida. Fotografía profesional de bodas, eventos y retratos.',
    images: ['https://res.cloudinary.com/dav2dvukf/image/upload/c_scale,w_400/b_rgb:2D2D2D,c_pad,g_center,h_630,w_1200/alma-fotografia/logo-og.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Agregar Google Search Console verification cuando esté disponible
    // google: 'your-verification-code',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${voga.variable} ${firaSans.variable} ${cormorantGaramond.variable}`}>
      <head>
        {/* Viewport - CRÍTICO para responsive */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#79502A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Alma Fotografía" />

        {/* Schema.org JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ProfessionalService',
              name: 'Alma Fotografía',
              image: 'https://res.cloudinary.com/dav2dvukf/image/upload/c_scale,w_400/b_rgb:2D2D2D,c_pad,g_center,h_630,w_1200/alma-fotografia/logo-og.png',
              '@id': 'https://almafotografiauy.com',
              url: 'https://almafotografiauy.com',
              telephone: '+598 92021392',
              priceRange: '$$',
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Uruguay',
                addressCountry: 'UY',
              },
              geo: {
                '@type': 'GeoCoordinates',
              },
              openingHoursSpecification: {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: [
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Friday',
                  'Saturday',
                ],
                opens: '09:00',
                closes: '20:00',
              },
              sameAs: [
                'https://www.instagram.com/alma_fotografia.uy',
              ],
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: 'https://almafotografiauy.com/buscar?q={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>
      <body className="font-fira antialiased">
        <ImageProtection />
        <ToastProvider>
          {children}
          <SpeedInsights />
          <Analytics />
        </ToastProvider>
      </body>
    </html>
  );
}