import React, { useState, useMemo } from 'react'
import { Icons } from './Icons'
import { TableSkeleton } from './Skeleton'
import { EmptyState } from './EmptyState'
import { Input, Select } from './Input'

export interface Column<T> {
  key: string
  header: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  width?: string
}

export interface FilterOption {
  key: string
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  error?: string
  searchQuery?: string
  onSearchChange?: (q: string) => void
  searchPlaceholder?: string
  filters?: FilterOption[]
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
  onRowClick?: (item: T) => void
  pageSize?: number
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  error = '',
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Arama yapın...',
  filters = [],
  emptyTitle = 'Kayıt bulunamadı',
  emptyDescription = 'Arama kriterlerinizi değiştirin veya yeni bir kayıt ekleyin.',
  emptyAction,
  onRowClick,
  pageSize = 15,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortOrder === 'asc') setSortOrder('desc')
      else {
        setSortKey(null)
        setSortOrder('asc')
      }
    } else {
      setSortKey(key)
      setSortOrder('asc')
    }
  }

  const sortedData = useMemo(() => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      const valA = a[sortKey] ?? ''
      const valB = b[sortKey] ?? ''
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sortKey, sortOrder])

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, currentPage, pageSize])

  return (
    <div className="table-wrapper">
      {(onSearchChange || filters.length > 0) && (
        <div className="table-toolbar">
          {onSearchChange && (
            <div className="table-search">
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery ?? ''}
                onChange={(e) => {
                  onSearchChange(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
          )}
          {filters.length > 0 && (
            <div className="table-filters">
              {filters.map((f) => (
                <Select
                  key={f.key}
                  value={f.value}
                  onChange={(e) => {
                    f.onChange(e.target.value)
                    setCurrentPage(1)
                  }}
                  options={f.options}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {error ? (
        <div className="table-error-box">
          <Icons.Alert size={20} />
          <span>{error}</span>
        </div>
      ) : isLoading ? (
        <TableSkeleton rows={pageSize > 6 ? 6 : pageSize} cols={columns.length} />
      ) : paginatedData.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          icon={<Icons.Search size={36} />}
          action={emptyAction}
        />
      ) : (
        <>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      style={{ width: col.width, textAlign: col.align || 'left' }}
                      className={col.sortable ? 'sortable' : ''}
                      onClick={() => col.sortable && handleSort(col.key)}
                    >
                      <div className="th-content" style={{ justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start' }}>
                        <span>{col.header}</span>
                        {col.sortable && (
                          <span className="sort-icon">
                            {sortKey === col.key ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item, idx) => (
                  <tr
                    key={item.id || idx}
                    className={onRowClick ? 'clickable-row' : ''}
                    onClick={() => onRowClick && onRowClick(item)}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        style={{ textAlign: col.align || 'left' }}
                      >
                        {col.render ? col.render(item) : item[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="table-pagination">
              <span className="pagination-info">
                Toplam {sortedData.length} kayıttan {(currentPage - 1) * pageSize + 1}-
                {Math.min(currentPage * pageSize, sortedData.length)} gösteriliyor
              </span>
              <div className="pagination-controls">
                <button
                  className="page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  <Icons.ChevronLeft size={16} />
                </button>
                <span className="page-current">
                  {currentPage} / {totalPages}
                </span>
                <button
                  className="page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  <Icons.ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
