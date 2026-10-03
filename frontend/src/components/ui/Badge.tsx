import React from 'react'

export interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'gray' | 'accent' | 'blue'
  size?: 'sm' | 'md'
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gray',
  size = 'md',
  className = '',
}) => {
  return (
    <span className={`badge badge-${variant} badge-${size} ${className}`}>
      {children}
    </span>
  )
}

export function jobStatusBadgeVariant(status: string): BadgeProps['variant'] {
  switch (status) {
    case 'hazir':
    case 'teslim_edildi':
      return 'success'
    case 'baskida':
      return 'blue'
    case 'onay_bekliyor':
    case 'desen_hazirlaniyor':
      return 'warning'
    case 'yeni':
      return 'accent'
    case 'iptal_edildi':
      return 'danger'
    default:
      return 'gray'
  }
}
