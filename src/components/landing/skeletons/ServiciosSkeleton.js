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
            <div
              key={i}
              className="bg-gray-50 rounded-2xl overflow-hidden shadow-sm"
            >
              {/* Image Skeleton */}
              <div className="h-64 bg-gray-200 animate-pulse" />

              {/* Content Skeleton */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                  <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
