# SEO Checklist - Alma Fotografía

## ✅ Implementado

### Metadata Completa
- ✅ Title tags dinámicos con template
- ✅ Meta descriptions optimizadas
- ✅ Keywords relevantes
- ✅ Open Graph tags (Facebook, WhatsApp)
- ✅ Twitter Cards
- ✅ Robots meta tags
- ✅ Canonical URLs

### Archivos SEO
- ✅ robots.txt dinámico (`/robots.txt`)
- ✅ sitemap.xml dinámico (`/sitemap.xml`)
- ✅ manifest.json para PWA

### Datos Estructurados
- ✅ Schema.org JSON-LD (ProfessionalService)
- ✅ Organization markup
- ✅ SearchAction markup

### Performance
- ✅ Image optimization (WebP/AVIF)
- ✅ Compression enabled
- ✅ Security headers
- ✅ Cache headers
- ✅ SWC minification

---

## 📝 Pendiente de Completar

### 1. Google Search Console
1. Ir a: https://search.google.com/search-console
2. Agregar propiedad: `https://alma-fotografia.vercel.app`
3. Verificar propiedad (usar meta tag)
4. Copiar el código de verificación
5. Agregarlo en `src/app/layout.js`:
   ```js
   verification: {
     google: 'TU_CODIGO_AQUI',
   },
   ```

### 2. Datos del Negocio
Actualizar en `src/app/layout.js` (Schema.org):
- [ ] `telephone`: Número de teléfono
- [ ] `address`: Dirección completa
- [ ] `geo.latitude`: Coordenadas GPS
- [ ] `geo.longitude`: Coordenadas GPS

### 3. Redes Sociales
Agregar en `src/app/layout.js` (sameAs):
```js
sameAs: [
  'https://www.instagram.com/USUARIO',
  'https://www.facebook.com/PAGINA',
  'https://www.linkedin.com/company/EMPRESA',
],
```

### 4. Favicon/Icons
Crear iconos optimizados:
- [ ] favicon.ico (32x32)
- [ ] apple-touch-icon.png (180x180)
- [ ] icon-192.png (192x192)
- [ ] icon-512.png (512x512)

Colocarlos en `/public/` o usar: https://realfavicongenerator.net/

### 5. Analytics
Instalar Google Analytics 4:
```bash
npm install @next/third-parties
```

Agregar en layout:
```js
import { GoogleAnalytics } from '@next/third-parties/google'

// En el <body>:
<GoogleAnalytics gaId="G-XXXXXXXXXX" />
```

---

## 🚀 Optimizaciones Avanzadas

### Performance
- [ ] Implementar lazy loading en imágenes pesadas
- [ ] Preload de recursos críticos
- [ ] Code splitting por rutas

### SEO Local
- [ ] Crear página "Contacto" con mapa
- [ ] Agregar LocalBusiness schema
- [ ] Optimizar para búsquedas locales

### Content
- [ ] Blog de fotografía (mejora SEO)
- [ ] Alt tags descriptivos en todas las imágenes
- [ ] Heading hierarchy (H1, H2, H3)

---

## 📊 Herramientas de Monitoreo

1. **Google Search Console**
   - Monitorear indexación
   - Ver keywords que posicionan
   - Detectar errores

2. **PageSpeed Insights**
   - https://pagespeed.web.dev/
   - Analizar Core Web Vitals
   - Optimizar performance

3. **Rich Results Test**
   - https://search.google.com/test/rich-results
   - Validar Schema.org markup

4. **Mobile-Friendly Test**
   - https://search.google.com/test/mobile-friendly

---

## 🎯 Objetivos de Performance

- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **TTI** (Time to Interactive): < 3.8s

---

## 📈 Próximos Pasos

1. Verificar en Google Search Console
2. Completar datos de contacto y ubicación
3. Crear iconos optimizados
4. Instalar Google Analytics
5. Monitorear métricas semanalmente

---

**Generado por Claude Code**
Última actualización: $(date)
