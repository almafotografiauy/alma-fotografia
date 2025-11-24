/**
 * ServiciosSkeleton
 *
 * Shimmer skeleton para la sección de servicios
 * Se muestra mientras se cargan los datos del servidor
 */

export default function ServiciosSkeleton() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Skeleton */}
        <div className="text-center mb-16">
          <div className="h-12 w-64 bg-gray-200 rounded-lg mx-auto mb-4 animate-pulse" />
          <div className="w-20 h-1 bg-gray-200 mx-auto rounded-full mb-6 animate-pulse" />
          <div className="h-4 w-96 bg-gray-200 rounded mx-auto animate-pulse" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <ServiceCardSkeleton key={i} delay={i * 0.1} />
          ))}
        </div>
      </div>
    </section>
  );
}

// Service Card Skeleton
function ServiceCardSkeleton({ delay }) {
  return (
    <div
      className="bg-gray-50 rounded-2xl overflow-hidden shadow-sm"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Image Skeleton con shimmer */}
      <div className="relative h-64 bg-gray-200 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
      </div>

      {/* Content Skeleton */}
      <div className="p-6 space-y-4">
        {/* Title */}
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />

        {/* Description */}
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Photo count */}
        <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />

        {/* Button */}
        <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}
