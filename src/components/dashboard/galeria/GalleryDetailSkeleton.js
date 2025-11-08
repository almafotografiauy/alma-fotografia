/**
 * GalleryDetailSkeleton - Skeleton loader para vista individual con masonry
 * 
 * Por qué este diseño:
 * - Simula el layout real (header + portada + uploader + masonry)
 * - Mantiene proporciones realistas
 * - Animación pulse suave
 * - Mobile-first responsive
 */
export default function GalleryDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="max-w-[2000px] mx-auto">
        
        {/* Header oscuro skeleton */}
        <div className="bg-[#2d2d2d] rounded-xl animate-pulse">
          <div className="px-5 sm:px-6 lg:px-8 py-4 sm:py-6">
            
            {/* Breadcrumb */}
            <div className="h-5 w-24 bg-white/10 rounded mb-4" />
            
            {/* Título y metadata */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-64 bg-white/20 rounded" />
                <div className="h-6 w-20 bg-white/10 rounded-full" />
              </div>
              
              {/* Descripción */}
              <div className="space-y-2 mb-4">
                <div className="h-4 w-full max-w-2xl bg-white/10 rounded" />
                <div className="h-4 w-3/4 bg-white/10 rounded" />
              </div>
              
              {/* Metadata tags */}
              <div className="flex flex-wrap gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-4 w-32 bg-white/10 rounded" />
                ))}
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-6 pt-4 border-t border-white/10">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <div className="w-[18px] h-[18px] bg-white/20 rounded" />
                  </div>
                  <div>
                    <div className="h-5 w-12 bg-white/20 rounded mb-1" />
                    <div className="h-3 w-16 bg-white/10 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="space-y-1 mt-1">
          
          {/* Portada skeleton */}
          <div className="bg-white py-4 sm:py-6 px-2 sm:px-6 lg:px-8 border-b border-gray-200 animate-pulse">
            <div className="relative w-full max-w-2xl mx-auto aspect-[3/2] bg-gray-200 rounded-lg" />
            <div className="h-3 w-64 bg-gray-200 rounded mx-auto mt-2" />
          </div>

          {/* Uploader skeleton */}
          <div className="bg-white py-4 sm:py-6 px-2 sm:px-6 lg:px-8 border-b border-gray-200 animate-pulse">
            <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
            <div className="h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-200" />
          </div>

          {/* Grid masonry skeleton */}
          <div className="bg-white">
            {/* Toolbar */}
            <div className="py-4 sm:py-6 px-2 sm:px-6 lg:px-8 border-b border-gray-200 animate-pulse">
              <div className="h-6 w-24 bg-gray-200 rounded mb-3" />
              <div className="h-9 w-28 bg-gray-200 rounded-lg" />
            </div>

            {/* Masonry grid skeleton */}
            <div className="px-0 sm:px-2 lg:px-4 py-2 sm:py-4 animate-pulse">
              <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 2xl:columns-8 gap-0.5 sm:gap-2">
                {/* Fotos con diferentes alturas para simular masonry */}
                {[
                  'aspect-[3/4]',   // Vertical
                  'aspect-square',  // Cuadrada
                  'aspect-[4/3]',   // Horizontal
                  'aspect-[3/4]',
                  'aspect-[4/5]',
                  'aspect-square',
                  'aspect-[4/3]',
                  'aspect-[3/4]',
                  'aspect-[5/4]',
                  'aspect-square',
                  'aspect-[3/4]',
                  'aspect-[4/3]',
                  'aspect-[3/4]',
                  'aspect-square',
                  'aspect-[4/3]',
                  'aspect-[3/4]',
                  'aspect-[5/4]',
                  'aspect-square',
                  'aspect-[4/3]',
                  'aspect-[3/4]',
                ].map((aspectRatio, i) => (
                  <div
                    key={i}
                    className={`mb-0.5 sm:mb-2 break-inside-avoid ${aspectRatio} bg-gray-200 rounded`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}