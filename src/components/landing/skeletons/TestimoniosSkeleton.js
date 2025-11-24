/**
 * TestimoniosSkeleton
 *
 * Shimmer skeleton para la sección de testimonios
 * Se muestra mientras se cargan los datos del servidor
 */

export default function TestimoniosSkeleton() {
  return (
    <section className="py-20 bg-gradient-to-br from-[#f8f6f3] via-white to-[#faf8f5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Skeleton */}
        <div className="text-center mb-16">
          <div className="h-12 w-48 bg-gray-200 rounded-lg mx-auto mb-4 animate-pulse" />
          <div className="w-20 h-1 bg-gray-200 mx-auto rounded-full mb-6 animate-pulse" />
          <div className="h-4 w-80 bg-gray-200 rounded mx-auto animate-pulse" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <TestimonialCardSkeleton key={i} delay={i * 0.05} />
          ))}
        </div>
      </div>
    </section>
  );
}

// Testimonial Card Skeleton
function TestimonialCardSkeleton({ delay }) {
  return (
    <div
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Stars Skeleton */}
      <div className="flex items-center gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            className="w-4 h-4 bg-gray-200 rounded-full animate-pulse"
          />
        ))}
      </div>

      {/* Comment Skeleton con shimmer */}
      <div className="space-y-2 mb-6 relative overflow-hidden">
        <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
        <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
        <div className="h-3 w-2/3 bg-gray-200 rounded animate-pulse" />

        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
      </div>

      {/* Client Info Skeleton */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
