import { createContext, forwardRef, useContext, useId, useState } from 'react'
import { cn } from '@/utils/cn'

const RadioContext = createContext(null)

export function RadioGroup({ name, value, onValueChange, defaultValue, className, children, ...props }) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? null)
  const isControlled = value !== undefined

  const currentValue = isControlled ? value : internalValue
  const handleChange = (next) => {
    if (!isControlled) setInternalValue(next)
    onValueChange?.(next)
  }

  return (
    <RadioContext.Provider value={{ name, value: currentValue, onValueChange: handleChange }}>
      <div role="radiogroup" className={cn('flex flex-col gap-2.5', className)} {...props}>
        {children}
      </div>
    </RadioContext.Provider>
  )
}

/**
 * Animated radio item — must be used inside <RadioGroup>.
 */
export const Radio = forwardRef(function Radio(
  { className, id, value, label, description, disabled = false, ...props },
  ref,
) {
  const context = useContext(RadioContext)
  const autoId = useId()
  const inputId = id ?? autoId

  const checked = context ? context.value === value : false
  const handleChange = () => context?.onValueChange?.(value)

  return (
    <label
      htmlFor={inputId}
      className={cn(
        'group inline-flex cursor-pointer items-start gap-3',
        disabled && 'cursor-not-allowed opacity-60',
        className,
      )}
    >
      <input
        ref={ref}
        id={inputId}
        type="radio"
        name={context?.name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={handleChange}
        className="sr-only"
        {...props}
      />
      <span
        className={cn(
          'mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full border transition-all duration-[var(--duration-fast)]',
          checked ? 'border-primary' : 'border-border-strong group-hover:border-primary/60',
        )}
      >
        <span
          className={cn(
            'size-2 rounded-full bg-primary transition-transform duration-[var(--duration-fast)]',
            checked ? 'scale-100' : 'scale-0',
          )}
        />
      </span>
      {label || description ? (
        <span className="flex flex-col gap-0.5">
          {label ? <span className="text-sm font-medium leading-5 text-foreground">{label}</span> : null}
          {description ? <span className="text-xs leading-4 text-muted">{description}</span> : null}
        </span>
      ) : null}
    </label>
  )
})

export default Radio
