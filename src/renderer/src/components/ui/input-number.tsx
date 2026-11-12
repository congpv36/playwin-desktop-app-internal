import * as React from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons'

const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ')

export interface InputNumberProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  error?: string
  value: number
  onChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  allowMouseWheel?: boolean
  formatOptions?: Intl.NumberFormatOptions
  allowNegative?: boolean
  precision?: number
}

const InputNumber = React.forwardRef<HTMLInputElement, InputNumberProps>(
  (
    {
      className,
      error,
      value,
      onChange,
      min = 0,
      max = Number.MAX_SAFE_INTEGER,
      step = 1,
      allowMouseWheel = true,
      formatOptions = {},
      allowNegative = false,
      disabled,
      precision = 2,
      onBlur,
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const mergedRef = useMergedRef(ref, inputRef)

    const theme = 'green'

    const themeClasses = {
      blue: 'focus-within:ring-[#C0443C] focus-within:border-[#C0443C]',
      green: 'focus-within:ring-[#C0443C] focus-within:border-[#C0443C]',
      purple: 'focus-within:ring-[#7F56D9] focus-within:border-[#7F56D9]'
    }

    const spinnerThemeClasses = {
      blue: 'active:bg-blue-200',
      green: 'active:bg-green-200',
      purple: 'active:bg-gray-200'
    }

    const errorClasses = error
      ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500'
      : 'border-[#373A41]'

    const fixPrecision = (num: number): number => {
      return Number(num.toFixed(precision))
    }

    // 🟢 State nội bộ để giữ string hiển thị
    const [displayValue, setDisplayValue] = React.useState<string>(value.toString())

    // Sync khi prop value thay đổi từ ngoài
    React.useEffect(() => {
      if (!inputRef.current || inputRef.current !== document.activeElement) {
        setDisplayValue(value.toFixed(precision))
      }
    }, [value, precision])

    const increment = () => {
      if (disabled) return
      const newValue = fixPrecision(Math.min(max, value + step))
      onChange?.(newValue)
    }

    const decrement = () => {
      if (disabled) return
      const shouldAllowNegative = allowNegative || min < 0
      const minValue = shouldAllowNegative ? Math.min(min, -Math.abs(min)) : min
      const newValue = fixPrecision(Math.max(minValue, value - step))
      onChange?.(newValue)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return
      const input = e.target.value
      setDisplayValue(input)

      const shouldAllowNegative = allowNegative || min < 0
      const validNumberRegex = shouldAllowNegative ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/
      if (!validNumberRegex.test(input)) return

      const parsed = parseFloat(input)
      if (!isNaN(parsed)) {
        onChange?.(parsed)
      }
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (disabled) return

      let parsed = parseFloat(displayValue)
      if (isNaN(parsed)) parsed = 0

      const shouldAllowNegative = allowNegative || min < 0
      const minValue = shouldAllowNegative ? Math.min(min, -Math.abs(min)) : min

      let constrained = Math.max(minValue, Math.min(max, parsed))
      constrained = fixPrecision(constrained)

      onChange?.(constrained)

      const formatted =
        formatOptions && Object.keys(formatOptions).length > 0
          ? new Intl.NumberFormat(undefined, formatOptions).format(constrained)
          : constrained.toFixed(precision)

      setDisplayValue(formatted)

      onBlur?.(e)
    }

    const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
      if (!allowMouseWheel || disabled) return
      if (document.activeElement === e.target) {
        e.preventDefault()
        if (e.deltaY < 0) increment()
        else decrement()
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        increment()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        decrement()
      }
    }
    const applyConstraints = () => {
      let parsed = parseFloat(displayValue)
      if (isNaN(parsed)) parsed = 0

      const shouldAllowNegative = allowNegative || min < 0
      const minValue = shouldAllowNegative ? Math.min(min, -Math.abs(min)) : min

      let constrained = Math.max(minValue, Math.min(max, parsed))
      constrained = fixPrecision(constrained)

      onChange?.(constrained)

      const formatted =
        formatOptions && Object.keys(formatOptions).length > 0
          ? new Intl.NumberFormat(undefined, formatOptions).format(constrained)
          : constrained.toFixed(precision)

      setDisplayValue(formatted)
    }
    const handleKeyDownExtended = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (['e', 'E', '+'].includes(e.key)) e.preventDefault()

      if (e.key === 'Enter') {
        applyConstraints()
      }

      if (e.key === '.' || e.key === ',') {
        const target = e.target as HTMLInputElement
        if (target.value.includes('.')) e.preventDefault()
      }

      if (e.key === '-') {
        const shouldAllowNegative = allowNegative || min < 0
        if (!shouldAllowNegative) {
          e.preventDefault()
          return
        }
        const target = e.target as HTMLInputElement
        const cursorPosition = target.selectionStart || 0
        if (cursorPosition !== 0 || target.value.includes('-')) {
          e.preventDefault()
          return
        }
      }

      handleKeyDown(e)
    }

    return (
      <div className="w-full ">
        <div
          className={cn(
            'flex items-stretch relative w-full rounded-md border border-border-default bg-transparent transition-colors bg-white ',
            themeClasses[theme],
            errorClasses,
            className
          )}
        >
          <input
            type="text"
            inputMode="decimal"
            className="flex-grow h-[30px] px-3 py-1 text-sm rounded-l-md rounded-r-md  border-0 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50 bg-inherit [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full"
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onWheel={handleWheel}
            onKeyDown={handleKeyDownExtended}
            ref={mergedRef}
            disabled={disabled}
            {...props}
          />

          <div className="flex flex-col absolute inset-y-0 right-1">
            <button
              type="button"
              tabIndex={-1}
              onClick={increment}
              className={cn(
                'flex items-center justify-center h-[18px] px-1 cursor-pointer rounded-tr-md',
                spinnerThemeClasses[theme],
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
              disabled={disabled || value >= max}
            >
              <ChevronUpIcon className="h-3 w-3" />
            </button>
            <button
              type="button"
              tabIndex={-1}
              onClick={decrement}
              className={cn(
                'flex items-center justify-center h-[18px] px-1 cursor-pointer rounded-br-md',
                spinnerThemeClasses[theme],
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
              disabled={disabled || value <= min}
            >
              <ChevronDownIcon className="h-3 w-3" />
            </button>
          </div>
        </div>

        {error && <div className="mt-1 text-xs text-red-500">{error}</div>}
      </div>
    )
  }
)

function useMergedRef<T = unknown>(
  ...refs: Array<React.MutableRefObject<T> | React.LegacyRef<T> | null | undefined>
): React.RefCallback<T> {
  return React.useCallback(
    (value: T) => {
      refs.forEach((ref) => {
        if (typeof ref === 'function') {
          ref(value)
        } else if (ref != null) {
          ;(ref as React.MutableRefObject<T | null>).current = value
        }
      })
    },
    [refs]
  )
}

InputNumber.displayName = 'InputNumber'
export { InputNumber }
