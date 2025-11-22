# 🎨 Sistema de Diseño - Alma Fotografía

## Paleta de Colores

### Colores Primarios

#### Blanco (Predominante)
- **#FFFFFF** - Fondo principal de todas las páginas
- **#F9FAFB** (gray-50) - Fondos alternativos sutiles
- **#F3F4F6** (gray-100) - Fondos de cards en hover

**Uso:**
- Fondo de páginas completas
- Fondo de cards y contenedores
- Fondo de modales
- Espacios principales

#### Negro/Gris Oscuro
- **#2D2D2D** - Solo para elementos estructurales

**Uso EXCLUSIVO en:**
- Sidebar de navegación
- Headers de página
- Títulos principales (h1, h2)
- Texto principal en contenido

**NO usar en:**
- Fondos de cards
- Botones grandes
- Fondos de secciones

#### Marrón Cálido (Color de Marca)
- **#8B5E3C** - Principal
- **#6d4a2f** - Hover/Activo
- **#5a3c24** - Pressed

**Uso en:**
- Todos los botones principales de acción
- Botón "Salir/Logout" (cambiar de rojo a marrón)
- Botón "Compartir" en galerías (siempre marrón, no blanco)
- Checkboxes activos
- Toggles/switches activos
- Radio buttons seleccionados
- Links importantes
- Iconos de acción
- Tabs activos
- Elementos interactivos seleccionados

**NO usar en:**
- Fondos grandes
- Backgrounds de secciones

### Colores de Estructura

#### Grises (Para bordes y texto)
- **#E5E7EB** (gray-200) - Bordes principales
- **#D1D5DB** (gray-300) - Bordes en hover
- **#9CA3AF** (gray-400) - Bordes sutiles
- **#6B7280** (gray-500) - Texto terciario
- **#4B5563** (gray-600) - Texto secundario
- **#374151** (gray-700) - Texto secundario importante
- **#1F2937** (gray-800) - Texto principal
- **#111827** (gray-900) - Texto principal oscuro

### Colores Funcionales

#### Estados de Éxito
- **#10B981** (green-600) - Confirmación/Guardar
- **#059669** (green-700) - Hover confirmación

**Uso:**
- Botones "Guardar"
- Botones "Confirmar"
- Botones "Aprobar"
- Badges de éxito
- Notificaciones de éxito

#### Estados de Error/Destructivo
- **#EF4444** (red-600) - Eliminar/Rechazar
- **#DC2626** (red-700) - Hover destructivo

**Uso:**
- Botones "Eliminar"
- Botones "Rechazar"
- Botones "Cancelar" (contexto destructivo)
- Mensajes de error
- Badges de error

#### Estados de Información
- **#3B82F6** (blue-600) - Información
- **#2563EB** (blue-700) - Hover información

**Uso (opcional):**
- Mensajes informativos
- Badges de información
- Links de ayuda

---

## Tipografía

### Familias de Fuentes

```css
--font-voga: 'Voga', serif;        /* Títulos elegantes */
--font-fira: 'Fira Sans', sans-serif;  /* Cuerpo y UI */
```

### Jerarquía de Texto

#### Títulos
```jsx
// H1 - Título de página
className="font-voga text-3xl md:text-4xl text-gray-900 mb-2"

// H2 - Subtítulo de sección
className="font-voga text-2xl md:text-3xl text-gray-900 mb-2"

// H3 - Título de card/componente
className="font-voga text-xl md:text-2xl text-gray-900 mb-1"
```

#### Cuerpo
```jsx
// Texto principal
className="font-fira text-base text-gray-900"

// Texto secundario
className="font-fira text-sm text-gray-600"

// Texto pequeño/metadata
className="font-fira text-xs text-gray-500"

// Labels de formulario
className="font-fira text-sm font-medium text-gray-700 mb-2"
```

---

## Componentes Base

### Botones

#### Botón Principal (Marrón)
```jsx
className="px-4 py-2.5 bg-[#8B5E3C] hover:bg-[#6d4a2f] active:bg-[#5a3c24]
           text-white font-fira text-sm font-medium
           rounded-lg shadow-sm hover:shadow-md
           transition-all duration-200
           focus:outline-none focus:ring-2 focus:ring-[#8B5E3C] focus:ring-offset-2"
```

**Uso:**
- Crear/Nuevo
- Editar
- Compartir (siempre marrón, no blanco)
- Salir/Logout (cambiar de rojo)
- Acciones principales

#### Botón Secundario (Blanco con borde)
```jsx
className="px-4 py-2.5 bg-white hover:bg-gray-50 active:bg-gray-100
           text-gray-700 font-fira text-sm font-medium
           border border-gray-300
           rounded-lg shadow-sm
           transition-all duration-200
           focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
```

**Uso:**
- Cancelar (no destructivo)
- Acciones secundarias
- Filtros

#### Botón de Éxito (Verde)
```jsx
className="px-4 py-2.5 bg-green-600 hover:bg-green-700 active:bg-green-800
           text-white font-fira text-sm font-medium
           rounded-lg shadow-sm hover:shadow-md
           transition-all duration-200
           focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
```

**Uso:**
- Guardar
- Confirmar
- Aprobar

#### Botón Destructivo (Rojo)
```jsx
className="px-4 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800
           text-white font-fira text-sm font-medium
           rounded-lg shadow-sm hover:shadow-md
           transition-all duration-200
           focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
```

**Uso:**
- Eliminar
- Rechazar
- Cancelar (destructivo)

### Cards

#### Card Base
```jsx
className="bg-white border border-gray-200 rounded-lg shadow-sm
           hover:shadow-md transition-all duration-200 p-6"
```

#### Card con Hover Interactivo
```jsx
className="bg-white border border-gray-200 hover:border-[#8B5E3C]
           rounded-lg shadow-sm hover:shadow-lg
           transition-all duration-200 p-6
           cursor-pointer group"
```

### Inputs

#### Input de Texto
```jsx
className="w-full px-3 py-2.5
           bg-white border border-gray-300
           text-gray-900 placeholder-gray-400
           rounded-lg font-fira text-sm
           focus:outline-none focus:ring-2 focus:ring-[#8B5E3C] focus:border-transparent
           transition-all duration-200"
```

#### Textarea
```jsx
className="w-full px-3 py-2.5
           bg-white border border-gray-300
           text-gray-900 placeholder-gray-400
           rounded-lg font-fira text-sm
           focus:outline-none focus:ring-2 focus:ring-[#8B5E3C] focus:border-transparent
           resize-none transition-all duration-200"
```

#### Select/Dropdown
```jsx
className="w-full px-3 py-2.5
           bg-white border border-gray-300
           text-gray-900
           rounded-lg font-fira text-sm
           focus:outline-none focus:ring-2 focus:ring-[#8B5E3C] focus:border-transparent
           transition-all duration-200
           cursor-pointer"
```

### Checkboxes y Toggles

#### Checkbox
```jsx
className="w-4 h-4 text-[#8B5E3C] border-gray-300 rounded
           focus:ring-[#8B5E3C] focus:ring-2
           transition-all duration-200"
```

#### Toggle/Switch (cuando está activo)
```jsx
className="bg-[#8B5E3C]" // Activo
className="bg-gray-200"   // Inactivo
```

### Modales

#### Modal Container (MÁS AMPLIO)
```jsx
// Overlay
className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"

// Content - Desktop (más amplio)
className="relative bg-white rounded-xl shadow-2xl
           w-full max-w-3xl mx-4
           max-h-[90vh] overflow-y-auto
           p-6 md:p-8"

// Content - Mobile
className="relative bg-white rounded-t-xl shadow-2xl
           w-full
           max-h-[95vh] overflow-y-auto
           p-6"
```

**Tamaños recomendados:**
- Modal pequeño: `max-w-md` (432px)
- Modal medio: `max-w-2xl` (672px)
- Modal grande: `max-w-3xl` (768px) ← **USAR PARA EDICIÓN**
- Modal extra grande: `max-w-4xl` (896px)
- Modal compartir: `max-w-2xl` (672px)

#### Modal Header
```jsx
className="flex items-start justify-between mb-6 pb-4 border-b border-gray-200"
```

#### Modal Footer
```jsx
className="flex flex-col sm:flex-row items-stretch sm:items-center
           justify-end gap-3 mt-6 pt-4 border-t border-gray-200"
```

### Tabs

#### Tab Container
```jsx
className="flex gap-2 border-b border-gray-200 mb-6"
```

#### Tab Button
```jsx
// Activo
className="px-4 py-3 font-fira text-sm font-medium
           border-b-2 border-[#8B5E3C] text-[#8B5E3C]
           transition-all duration-200"

// Inactivo
className="px-4 py-3 font-fira text-sm font-medium
           border-b-2 border-transparent text-gray-500
           hover:text-gray-700 hover:border-gray-300
           transition-all duration-200"
```

### Badges

#### Badge Base
```jsx
className="inline-flex items-center px-2.5 py-1
           rounded-full text-xs font-medium font-fira"
```

#### Badge Estados
```jsx
// Éxito
className="bg-green-100 text-green-800"

// Error
className="bg-red-100 text-red-800"

// Advertencia
className="bg-amber-100 text-amber-800"

// Información
className="bg-blue-100 text-blue-800"

// Neutral
className="bg-gray-100 text-gray-700"
```

---

## Espaciado y Padding

### Contenedores de Página
```jsx
className="min-h-screen bg-white p-6 md:p-8"
```

### Cards
```jsx
className="p-4 md:p-6"  // Normal
className="p-6 md:p-8"  // Grande
```

### Secciones
```jsx
className="mb-6"  // Entre secciones
className="mb-8"  // Entre secciones principales
```

---

## Sombras

```jsx
className="shadow-sm"    // Sutil
className="shadow"       // Normal
className="shadow-md"    // Media
className="shadow-lg"    // Grande
className="shadow-xl"    // Extra grande
className="shadow-2xl"   // Máxima (modales)
```

---

## Bordes y Radio

### Border Radius
```jsx
className="rounded-lg"   // 8px - Predeterminado
className="rounded-xl"   // 12px - Cards destacadas, modales
className="rounded-2xl"  // 16px - Elementos grandes
className="rounded-full" // Circular - Badges, avatares
```

### Borders
```jsx
className="border border-gray-200"       // Normal
className="border-2 border-gray-300"     // Destacado
className="border-b border-gray-100"     // Separador sutil
```

---

## Animaciones y Transiciones

### Transiciones Base
```jsx
className="transition-all duration-200 ease-in-out"
```

### Hover States
```jsx
className="hover:scale-105"      // Cards
className="hover:shadow-lg"      // Elevación
className="hover:bg-gray-50"     // Background
```

### Loading States
```jsx
className="animate-spin"         // Spinners
className="animate-pulse"        // Skeleton loaders
```

---

## Aplicación por Sección

### 1. Sidebar
- Fondo: `bg-[#2D2D2D]`
- Texto: `text-gray-300`
- Item activo: `bg-[#8B5E3C] text-white`
- Item hover: `hover:bg-gray-700`
- **Botón Salir:** `bg-[#8B5E3C] hover:bg-[#6d4a2f]` (cambiar de rojo)

### 2. Headers
- Fondo: `bg-[#2D2D2D]`
- Título: `text-white font-voga`
- Breadcrumbs: `text-gray-300`

### 3. Dashboard
- Fondo: `bg-white`
- Stats cards: `bg-white border-gray-200`
- Quick actions: Botones marrón

### 4. Agenda
- Fondo: `bg-white`
- Calendario header: `bg-[#2D2D2D]`
- Cards de eventos: `bg-white border-gray-200`
- Botones: Marrón

### 5. Galerías
- Fondo: `bg-white`
- Cards: `bg-white border-gray-200`
- **Botón Compartir:** `bg-[#8B5E3C]` (siempre, no blanco)
- Grid: Fondo blanco
- Modal editar: `max-w-3xl` (más amplio)
- Modal compartir: `max-w-2xl`

### 6. Configuración
- Fondo: `bg-white`
- Cards: `bg-white border-gray-200`
- Switches: Activo `bg-[#8B5E3C]`
- Tabs: Activo marrón

### 7. Testimonios
- Fondo: `bg-white`
- Cards: `bg-white border-gray-200`
- Stars: `text-[#8B5E3C]`
- Botones aprobar: Verde
- Botones rechazar: Rojo

---

## Correcciones Específicas Requeridas

### ✅ 1. Botón Salir/Logout
**Antes:** Rojo intenso
**Después:** Marrón #8B5E3C
```jsx
className="bg-[#8B5E3C] hover:bg-[#6d4a2f] text-white"
```

### ✅ 2. Botón Compartir en Galerías
**Antes:** Blanco sin hover
**Después:** Siempre marrón
```jsx
className="bg-[#8B5E3C] hover:bg-[#6d4a2f] text-white"
```

### ✅ 3. Modales de Edición
**Antes:** Muy pequeño en desktop
**Después:** Más amplio y proporcional
```jsx
className="max-w-3xl" // En lugar de max-w-md
```

### ✅ 4. Modal Compartir
**Después:** Más grande y coherente
```jsx
className="max-w-2xl" // Amplio pero no excesivo
```

---

## Principios de Diseño

1. **Espacio en Blanco:** Usar generosamente
2. **Jerarquía Visual:** Clara y definida
3. **Consistencia:** Mismos estilos en toda la app
4. **Minimalismo:** Sin elementos innecesarios
5. **Accesibilidad:** Contraste WCAG AA mínimo
6. **Responsive:** Mobile-first approach
7. **Performance:** Transiciones ligeras (200ms)

---

## Checklist de Implementación

- [ ] Cambiar botón Salir de rojo a marrón
- [ ] Cambiar botón Compartir a marrón siempre
- [ ] Ampliar modales de edición (max-w-3xl)
- [ ] Ampliar modal compartir (max-w-2xl)
- [ ] Verificar consistencia de botones marrón
- [ ] Revisar espaciado en todas las secciones
- [ ] Verificar contraste de textos
- [ ] Testing en mobile
- [ ] Testing en desktop
- [ ] Verificar funcionalidad intacta
