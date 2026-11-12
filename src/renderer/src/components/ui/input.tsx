import * as React from 'react'

const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ')

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  button?: {
    text: string
    onClick: () => void
  }
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, button, ...props }, ref) => {
    const theme = 'green'
    const themeClasses = {
      blue: 'focus:border-[#C0443C] focus:ring-[#C0443C]',
      green: 'focus:border-[#C0443C] focus:ring-[#C0443C]',
      purple: 'focus:border-[#7F56D9] focus:ring-[#7F56D9]'
    }

    const errorClasses = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-[#373A41]'

    return (
      <div className="w-full relative">
        <input
          className={cn(
            'flex h-[32px] w-full rounded-md border border-border-default bg-white px-3 py-1 text-sm transition-colors',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-muted-foreground',
            'disabled:cursor-not-allowed disabled:opacity-50',
            button ? 'pr-[100px]' : '',
            themeClasses[theme],
            errorClasses,
            className
          )}
          ref={ref}
          {...props}
        />
        {button && (
          <div className="absolute right-0 top-0 h-full mr-2 flex items-center">
            <button
              disabled={props.disabled}
              type="button"
              className={cn(
                'border-l py-[5px] pl-4 text-sm font-semibold text-[#C0443C]',
                props.disabled ? 'opacity-50 cursor-not-allowed' : ''
              )}
              onClick={button.onClick}
            >
              {button.text}
            </button>
          </div>
        )}
        {error && <div className="mt-1 text-xs text-red-500">{error}</div>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
