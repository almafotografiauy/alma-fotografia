import { voga, firaSans } from '@/fonts';
import './globals.css';
import { SpeedInsights } from "@vercel/speed-insights/next"

export const metadata = {
  metadataBase: new URL('https://alma-fotografia.vercel.app'),
  title: {
    default: 'Alma Fotografía | Fotografía Profesional de Eventos',
    template: '%s | Alma Fotografía'
  },
  description: 'Alma Fotografía - Capturamos los momentos más especiales de tu vida. Fotografía profesional de bodas, eventos, retratos y sesiones corporativas. Galerías privadas y descarga de fotos en alta calidad.',
  keywords: ['fotografía profesional', 'fotógrafo de bodas', 'fotografía de eventos', 'sesiones fotográficas', 'retratos profesionales', 'fotografía corporativa', 'galerías privadas', 'descargas de fotos'],
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
    url: 'https://alma-fotografia.vercel.app',
    title: 'Alma Fotografía | Fotografía Profesional de Eventos',
    description: 'Capturamos los momentos más especiales de tu vida. Fotografía profesional de bodas, eventos y retratos.',
    siteName: 'Alma Fotografía',
    images: [
      {
        url: '/img/logos/logo_BN_SF.png',
        width: 1200,
        height: 630,
        alt: 'Alma Fotografía Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alma Fotografía | Fotografía Profesional de Eventos',
    description: 'Capturamos los momentos más especiales de tu vida. Fotografía profesional de bodas, eventos y retratos.',
    images: ['/img/logos/logo_BN_SF.png'],
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
    <html lang="es" className={`${voga.variable} ${firaSans.variable}`}>
      <head>
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
              image: 'https://alma-fotografia.vercel.app/img/logos/logo_BN_SF.png',
              '@id': 'https://alma-fotografia.vercel.app',
              url: 'https://alma-fotografia.vercel.app',
              telephone: '',
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
                // Agregar redes sociales aquí cuando estén disponibles
                // 'https://www.instagram.com/almafotografia',
                // 'https://www.facebook.com/almafotografia',
              ],
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: 'https://alma-fotografia.vercel.app/buscar?q={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>
      <body className="font-fira antialiased">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}