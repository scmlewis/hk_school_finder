import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className = '', count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`skeleton-shimmer ${className}`}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

export function SkeletonBottomSheet() {
  return (
    <div className="p-4 sm:p-5 space-y-4">
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
      <Skeleton className="h-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-10 rounded-xl" />
        <Skeleton className="h-10 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="p-4 space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 flex-1 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonListCard() {
  return (
    <div className="p-3 border border-outline/10 rounded-xl space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
    </div>
  );
}
