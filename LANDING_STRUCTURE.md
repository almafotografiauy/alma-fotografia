# Landing Page - Alma Fotografía
## Código Completo Listo para Producción

---

## 📋 Índice de Archivos

```
src/
├─ app/
│  ├─ layout.js                          ✅ Layout principal con SEO y fuentes
│  ├─ page.js                            ✅ Landing page con ISR y Suspense
│  └─ api/
│     └─ public-booking/
│        └─ route.js                     ✅ API endpoint para reservas públicas
├─ components/
│  └─ landing/
│     ├─ Hero.client.js                  ✅ Hero fullscreen con parallax
│     ├─ Servicios.server.js             ✅ Server Component - fetch galerías
│     ├─ Servicios.client.js             ✅ Client Component - lightbox y animaciones
│     ├─ Testimonios.server.js           ✅ Server Component - fetch testimonios
│     ├─ Testimonios.client.js           ✅ Client Component - cards animadas
│     ├─ SobreAlma.server.js             ✅ Server Component - bio de Fernanda
│     ├─ Contacto.client.js              ✅ Client Component - formulario de reserva
│     ├─ Login.client.js                 ✅ Client Component - link a login
│     ├─ Footer.server.js                ✅ Server Component - footer con datos
│     └─ skeletons/
│        ├─ ServiciosSkeleton.js         ✅ Skeleton shimmer para servicios
│        └─ TestimoniosSkeleton.js       ✅ Skeleton shimmer para testimonios
└─ lib/
   ├─ server-actions.js                  ✅ Server Actions para landing
   └─ validation.js                      ✅ Validación de disponibilidad (agendaProvisoria)
```

---

## 🎯 Decisiones de Arquitectura

### 1. **Server/Client Component Split**
- **Server Components (.server.js)**: Fetch de datos, no requieren interactividad
  - Beneficio: Zero JavaScript al cliente, mejor SEO, fetch directo en servidor
- **Client Components (.client.js)**: Animaciones, forms, state
  - Beneficio: Interactividad fluida, menor bundle inicial

### 2. **ISR (Incremental Static Regeneration)**
- `revalidate: 300` (5 min) en page.js
- Cachea la página estática pero revalida cada 5 min
- Beneficio: Performance + datos actualizados

### 3. **Suspense Boundaries**
- Cada sección dinámica (Servicios, Testimonios) envuelta en Suspense
- Muestra skeletons mientras fetch
- Beneficio: Streaming, mejor UX, progressive rendering

### 4. **Dynamic Imports para Lightbox**
- Lightbox cargado solo cuando se abre
- `dynamic(() => import('...'), { ssr: false })`
- Beneficio: Reduce bundle inicial en ~40KB

### 5. **Validación de Disponibilidad (agendaProvisoria)**
- Integrada en `createPublicBooking`
- Comprueba conflictos de horario antes de crear reserva
- Aplica lógica de duración por servicio y solapamientos
- Beneficio: Evita doble bookings

### 6. **Optimización de Imágenes**
- `next/image` con `priority` en hero (LCP)
- Lazy loading en galerías
- Placeholder blur en testimonios
- Beneficio: LCP < 2.5s, mejor Core Web Vitals

---

## 📦 Variables de Entorno Necesarias

```env
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Cloudinary (opcional para imágenes)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=xxx
```

---

## 🚀 Instrucciones de Integración

### 1. Instalar dependencias
```bash
npm install framer-motion lucide-react
# Ya deberías tener: next, react, tailwindcss
```

### 2. Configurar Tailwind (tailwind.config.js)
```js
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        voga: ['Voga', 'serif'],
        fira: ['Fira Sans', 'sans-serif'],
      },
      colors: {
        brown: {
          dark: '#8B5E3C',
          medium: '#B89968',
          deep: '#6d4a2f',
        },
      },
    },
  },
}
```

### 3. Agregar fuentes (app/layout.js ya las incluye via CDN)

### 4. Crear tablas en Supabase (si no existen)

**Agregar columnas a testimonials:**
```sql
ALTER TABLE testimonials
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
```

**La tabla ya tiene `is_active`, no hace falta agregarlo**

### 5. Probar el flujo

**a) Marcar testimonios como destacados:**
```sql
UPDATE testimonials
SET is_featured = true, is_active = true
WHERE id IN ('id1', 'id2', 'id3');
```

**b) Marcar galerías como públicas:**
```sql
UPDATE galleries
SET is_public = true
WHERE id = 'gallery-id';
```

**c) Navegar a localhost:3000/**
- Debería mostrar landing completa
- Testimonios destacados aparecen automáticamente
- Galerías públicas en sección Servicios

**d) Probar reserva pública:**
- Completar formulario en sección Contacto
- Verificar que valide disponibilidad
- Revisar en Supabase tabla `bookings`

---

## ✅ Checklist de QA

### Performance
- [ ] LCP < 2.5s (hero con priority image)
- [ ] FID < 100ms (minimal JS)
- [ ] CLS < 0.1 (aspect-ratio en imágenes)
- [ ] Lighthouse score > 90

### Funcionalidad
- [ ] Testimonios destacados aparecen (filtro is_featured + is_active)
- [ ] Galerías públicas aparecen (filtro is_public)
- [ ] Lightbox abre/cierra correctamente
- [ ] Lightbox: navegación con teclado (← →, Esc)
- [ ] Formulario valida campos requeridos
- [ ] Formulario muestra error si horario no disponible
- [ ] Formulario muestra éxito si reserva se crea
- [ ] ISR revalida cada 5 min (crear galería y esperar)

### Responsive
- [ ] Mobile (320px): layout vertical, texto legible
- [ ] Tablet (768px): grid 2 columnas
- [ ] Desktop (1024px+): grid 3 columnas

### Accesibilidad
- [ ] Navegación con Tab funciona
- [ ] Lightbox cierra con Esc
- [ ] Contraste de texto WCAG AA
- [ ] Imágenes tienen alt descriptivo
- [ ] aria-labels en botones de iconos

### SEO
- [ ] Meta tags presentes (title, description, og)
- [ ] JSON-LD schema presente
- [ ] Imágenes optimizadas
- [ ] URLs semánticas

---

## 🎨 Paleta de Colores

```css
/* Marrones principales */
--brown-dark: #8B5E3C;
--brown-medium: #B89968;
--brown-deep: #6d4a2f;

/* Fondos */
--bg-light: #f8f6f3;
--bg-lighter: #faf8f5;

/* Gradientes */
background: linear-gradient(135deg, #f8f6f3 0%, #ffffff 50%, #faf8f5 100%);
```

---

## 📝 Notas de Implementación

### Testimonios
- Filtro: `is_featured = true AND is_active = true`
- Orden: `created_at DESC`
- Límite: 6 testimonios
- Si no hay destacados, mostrar mensaje placeholder

### Galerías
- Filtro: `is_public = true`
- Agrupadas por `service_type_id`
- Mostrar 1 galería por servicio (más reciente)
- Cover image + primeras 6 fotos para preview

### Reservas Públicas
- Validación integrada con lógica de `agendaProvisoria`
- Comprueba:
  1. Servicio existe y está activo
  2. Fecha/hora dentro de horario laboral
  3. No hay conflicto con otras reservas
  4. No hay bloqueos en ese rango
- Crea reserva con `status: 'pending'`

### Animaciones
- `prefers-reduced-motion` respetado
- Transiciones suaves 300-500ms
- Parallax sutil en hero (translateY máximo 50px)
- Staggered animations con `staggerChildren: 0.1`

---

A continuación se lista el código completo de cada archivo...
