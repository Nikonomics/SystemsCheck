/**
 * Skeleton loading components for smooth loading states
 */

export function Skeleton({ className = '', variant = 'rectangle' }) {
  const baseClasses = 'animate-pulse bg-gray-200';

  if (variant === 'circle') {
    return <div className={`${baseClasses} rounded-full ${className}`} />;
  }

  if (variant === 'text') {
    return <div className={`${baseClasses} rounded h-4 ${className}`} />;
  }

  return <div className={`${baseClasses} rounded ${className}`} />;
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
      <Skeleton className="h-6 w-1/3 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3 mb-4" />
      <div className="flex gap-4">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-3 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="px-6 py-4 border-t border-gray-200 flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white shadow rounded-lg p-6">
          <Skeleton className="h-4 w-1/2 mb-3" />
          <Skeleton className="h-8 w-1/3 mb-2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ items = 5 }) {
  return (
    <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="px-6 py-4 flex items-center gap-4">
          <Skeleton variant="circle" className="h-10 w-10" />
          <div className="flex-1">
            <Skeleton className="h-4 w-1/3 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ height = 'h-64' }) {
  return (
    <div className={`bg-white shadow rounded-lg p-6 ${height}`}>
      <Skeleton className="h-6 w-1/4 mb-4" />
      <div className="flex items-end justify-between h-[calc(100%-3rem)] gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1"
            style={{ height: `${20 + Math.random() * 60}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <Skeleton className="h-8 w-1/4 mb-2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      {/* Stats */}
      <SkeletonStats />
      {/* Table */}
      <SkeletonTable />
    </div>
  );
}
