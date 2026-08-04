import { Fragment } from 'react'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * Breadcrumb navigation.
 * @param {{ items: { label: string, href?: string }[] }} props
 */
export function Breadcrumb({ items = [], className, separator = null }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1 text-sm', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        const content = isLast ? (
          <span aria-current="page" className="font-medium text-foreground">
            {item.label}
          </span>
        ) : item.href ? (
          <a
            href={item.href}
            className="text-muted transition-colors hover:text-foreground"
          >
            {index === 0 && item.label === 'Home' ? <Home className="size-3.5" /> : item.label}
          </a>
        ) : (
          <span className="text-muted">{item.label}</span>
        )

        return (
          <Fragment key={`${item.label}-${index}`}>
            {index > 0 ? (
              <span className="text-muted/50" aria-hidden="true">
                {separator ?? <ChevronRight className="size-3.5" />}
              </span>
            ) : null}
            {content}
          </Fragment>
        )
      })}
    </nav>
  )
}

export default Breadcrumb
