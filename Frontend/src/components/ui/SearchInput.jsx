import { forwardRef, useId, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from './Input'
import { cn } from '@/utils/cn'

/**
 * Search input with leading icon, clear button and optional shortcut hint.
 */
export const SearchInput = forwardRef(function SearchInput(
  {
    className,
    placeholder = 'Search…',
    value,
    defaultValue = '',
    onChange,
    onClear,
    shortcut,
    size = 'md',
    variant = 'default',
    clearable = true,
    ...props
  },
  ref,
) {
  const autoId = useId()
  const [internalValue, setInternalValue] = useState(defaultValue)
  const isControlled = value !== undefined
  const currentValue = isControlled ? value : internalValue

  const handleChange = (event) => {
    if (!isControlled) setInternalValue(event.target.value)
    onChange?.(event)
  }

  const handleClear = () => {
    if (isControlled) {
      onClear?.()
    } else {
      setInternalValue('')
      onChange?.({ target: { value: '' } })
    }
    onClear?.()
  }

  return (
    <div className={cn('relative w-full', className)}>
      <Input
        id={`search-${autoId}`}
        ref={ref}
        role="searchbox"
        type="search"
        variant={variant}
        size={size}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="pr-16 [&::-webkit-search-cancel-button]:hidden"
        leftIcon={Search}
        {...props}
      />
      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {currentValue && clearable ? (
          <button
            type="button"
            onClick={handleClear}
            className="grid size-5 place-items-center rounded text-muted transition-colors hover:bg-background-soft hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
        {shortcut && !currentValue ? (
          <kbd className="pointer-events-none rounded border border-border bg-background-soft px-1.5 py-0.5 text-[10px] font-semibold text-muted">
            {shortcut}
          </kbd>
        ) : null}
      </div>
    </div>
  )
})

export default SearchInput
