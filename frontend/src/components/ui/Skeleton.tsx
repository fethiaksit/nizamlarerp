import React from 'react'

export interface SkeletonProps {
  className?: string
  width?: string
  height?: string
  borderRadius?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  borderRadius = '6px',
}) => {
  return (
    <div
      className={`skeleton-loader ${className}`}
      style={{ width, height, borderRadius }}
    />
  )
}

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4,
}) => (
  <div className="table-skeleton-container">
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="table-skeleton-row">
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton key={c} height="20px" width={c === 0 ? '40%' : '20%'} />
        ))}
      </div>
    ))}
  </div>
)
