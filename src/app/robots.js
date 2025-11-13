/**
 * robots.txt dinámico
 *
 * Next.js 13+ permite crear robots.txt como route handler
 * https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/*',
          '/api/*',
          '/_next/*',
        ],
      },
    ],
    sitemap: 'https://alma-fotografia.vercel.app/sitemap.xml',
  };
}
