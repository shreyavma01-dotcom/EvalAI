import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

export const Table = forwardRef(function Table({ className, dense = false, hover = true, striped = false, ...props }, ref) {
  return (
    <div className="group/table relative w-full overflow-x-auto">
      <table
        ref={ref}
        className={cn('w-full caption-bottom border-collapse text-sm', dense ? 'text-[13px]' : '', className)}
        data-hover={hover || undefined}
        data-striped={striped || undefined}
        {...props}
      />
    </div>
  )
})

export function TableHeader({ className, ...props }) {
  return (
    <thead
      className={cn('[&_tr]:border-b [&_tr]:border-border/70 [&_tr]:bg-background-soft/50', className)}
      {...props}
    />
  )
}

export function TableBody({ className, ...props }) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
}

export function TableFooter({ className, ...props }) {
  return (
    <tfoot
      className={cn('border-t border-border bg-background-soft/60 font-medium [&_td]:font-medium', className)}
      {...props}
    />
  )
}

export function TableRow({ className, onClick, ...props }) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'border-b border-border/60 transition-colors',
        'group-data-[hover=true]/table:hover:bg-background-soft/70',
        'group-data-[striped=true]/table:[&:nth-child(even)]:bg-background-soft/40',
        onClick && 'cursor-pointer',
        className,
      )}
      {...props}
    />
  )
}

export function TableHead({ className, ...props }) {
  return (
    <th
      className={cn(
        'h-11 whitespace-nowrap px-4 text-left align-middle text-xs font-semibold uppercase tracking-wider text-muted',
        className,
      )}
      {...props}
    />
  )
}

export function TableCell({ className, align = 'left', ...props }) {
  return (
    <td
      className={cn('px-4 py-3 align-middle', align === 'right' && 'text-right', align === 'center' && 'text-center', className)}
      {...props}
    />
  )
}

export function TableCaption({ className, ...props }) {
  return <caption className={cn('mt-4 text-sm text-muted', className)} {...props} />
}

export default Table
