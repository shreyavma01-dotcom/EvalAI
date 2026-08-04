import { useMemo } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '@/utils/cn'

function getPageItems(current, pageCount, siblings = 1) {
  const pages = []
  const totalVisible = siblings * 2 + 5
  if (pageCount <= totalVisible) {
    for (let i = 1; i <= pageCount; i += 1) pages.push(i)
    return pages
  }
  const left = Math.max(2, current - siblings)
  const right = Math.min(pageCount - 1, current + siblings)
  pages.push(1)
  if (left > 2) pages.push('ellipsis-start')
  for (let i = left; i <= right; i += 1) pages.push(i)
  if (right < pageCount - 1) pages.push('ellipsis-end')
  pages.push(pageCount)
  return pages
}

/**
 * Pagination with ellipsis, first/last and prev/next controls.
 */
export function Pagination({ page = 1, pageCount = 1, onPageChange, siblings = 1, showFirstLast = true, compact = false, className }) {
  const items = useMemo(() => getPageItems(page, pageCount, siblings), [page, pageCount, siblings])

  const goTo = (next) => {
    if (next < 1 || next > pageCount || next === page) return
    onPageChange?.(next)
  }

  const navClass = (disabled) =>
    cn(
      'grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors',
      disabled ? 'pointer-events-none opacity-40' : 'hover:bg-accent hover:text-foreground',
    )

  if (pageCount <= 1) return null

  return (
    <nav aria-label="Pagination" className={cn('flex items-center justify-between gap-2', className)}>
      {!compact ? (
        <span className="text-sm text-muted">
          Page <span className="font-medium text-foreground">{page}</span> of{' '}
          <span className="font-medium text-foreground">{pageCount}</span>
        </span>
      ) : null}
      <div className="flex items-center gap-1">
        {showFirstLast ? (
          <button type="button" onClick={() => goTo(1)} className={navClass(page === 1)} aria-label="First page">
            <ChevronsLeft className="size-4" />
          </button>
        ) : null}
        <button type="button" onClick={() => goTo(page - 1)} className={navClass(page === 1)} aria-label="Previous page">
          <ChevronLeft className="size-4" />
        </button>
        <div className="flex items-center gap-1 px-1">
          {items.map((item) =>
            item === 'ellipsis-start' || item === 'ellipsis-end' ? (
              <span key={item} className="grid h-8 w-8 place-items-center text-sm text-muted">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => goTo(item)}
                aria-current={item === page ? 'page' : undefined}
                className={cn(
                  'grid h-8 min-w-8 place-items-center rounded-lg px-1.5 text-sm font-medium transition-colors',
                  item === page ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted hover:bg-accent hover:text-foreground',
                )}
              >
                {item}
              </button>
            ),
          )}
        </div>
        <button type="button" onClick={() => goTo(page + 1)} className={navClass(page === pageCount)} aria-label="Next page">
          <ChevronRight className="size-4" />
        </button>
        {showFirstLast ? (
          <button type="button" onClick={() => goTo(pageCount)} className={navClass(page === pageCount)} aria-label="Last page">
            <ChevronsRight className="size-4" />
          </button>
        ) : null}
      </div>
    </nav>
  )
}

export default Pagination
