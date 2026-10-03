import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => (
  <div className={`card ${className}`} {...props}>
    {children}
  </div>
)

export const CardHeader: React.FC<CardProps> = ({ children, className = '', ...props }) => (
  <div className={`card-header ${className}`} {...props}>
    {children}
  </div>
)

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className = '', ...props }) => (
  <h3 className={`card-title ${className}`} {...props}>
    {children}
  </h3>
)

export const CardContent: React.FC<CardProps> = ({ children, className = '', ...props }) => (
  <div className={`card-content ${className}`} {...props}>
    {children}
  </div>
)

export interface MetricCardProps {
  title: string
  value: React.ReactNode
  subtitle?: string
  icon?: React.ReactNode
  trend?: { value: string; isPositive: boolean }
  tone?: 'default' | 'accent' | 'blue' | 'success' | 'danger' | 'warning'
  onClick?: () => void
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  tone = 'default',
  onClick,
}) => (
  <div
    className={`metric-card tone-${tone} ${onClick ? 'clickable' : ''}`}
    onClick={onClick}
  >
    <div className="metric-card-top">
      <span className="metric-card-title">{title}</span>
      {icon && <span className="metric-card-icon">{icon}</span>}
    </div>
    <div className="metric-card-value">{value}</div>
    {(subtitle || trend) && (
      <div className="metric-card-footer">
        {trend && (
          <span className={`metric-trend ${trend.isPositive ? 'positive' : 'negative'}`}>
            {trend.isPositive ? '▲' : '▼'} {trend.value}
          </span>
        )}
        {subtitle && <span className="metric-card-subtitle">{subtitle}</span>}
      </div>
    )}
  </div>
)
