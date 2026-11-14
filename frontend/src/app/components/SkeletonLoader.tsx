"use client";

// Shimmer animation component
const Shimmer = () => (
  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
);

// Coach Card Skeleton
export function CoachCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 overflow-hidden relative">
      <div className="flex items-center space-x-4 mb-4">
        {/* Avatar skeleton */}
        <div className="relative">
          <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        <div className="flex-1">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-2 animate-pulse" />
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 animate-pulse" />
        </div>
      </div>

      {/* Rating skeleton */}
      <div className="flex items-center space-x-2 mb-4">
        <div className="flex space-x-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"
            />
          ))}
        </div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20 animate-pulse" />
      </div>

      {/* Hourly rate skeleton */}
      <div className="flex items-center space-x-2 mb-6">
        <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 animate-pulse" />
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16 animate-pulse" />
      </div>

      {/* Button skeleton */}
      <div className="h-12 bg-gray-300 dark:bg-gray-600 rounded-lg animate-pulse" />
    </div>
  );
}

// Dashboard Section Skeleton
export function DashboardSectionSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-48 animate-pulse" />
        <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
      </div>

      {/* Chart skeleton */}
      <div className="space-y-6">
        {/* Legend skeleton */}
        <div className="flex items-center space-x-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16 animate-pulse" />
            </div>
          ))}
        </div>

        {/* Chart bars skeleton */}
        <div className="relative h-64">
          <div className="absolute inset-0 flex items-end justify-between px-4 pb-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex flex-col items-center space-y-2">
                <div className="flex items-end space-x-1 h-48">
                  {[...Array(3)].map((_, j) => (
                    <div
                      key={j}
                      className="w-8 bg-gray-300 dark:bg-gray-600 rounded-t animate-pulse"
                      style={{ height: `${Math.random() * 80 + 20}%` }}
                    />
                  ))}
                </div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-8 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="text-center">
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-2 animate-pulse" />
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20 mx-auto animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Calendar Skeleton
export function CalendarSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-32 animate-pulse" />
        <div className="flex space-x-2">
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
        </div>
      </div>

      {/* Days of week skeleton */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="h-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"
          />
        ))}
      </div>

      {/* Calendar grid skeleton */}
      <div className="grid grid-cols-7 gap-2">
        {[...Array(35)].map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-gray-300 dark:bg-gray-600 rounded animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

// Coaches Grid Skeleton
export function CoachesGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ animationDelay: `${i * 100}ms` }}>
          <CoachCardSkeleton />
        </div>
      ))}
    </div>
  );
}

// Generic shimmer skeleton for any content
export function ShimmerSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-gray-300 dark:bg-gray-600 rounded animate-pulse ${className}`}
    >
      <Shimmer />
    </div>
  );
}
