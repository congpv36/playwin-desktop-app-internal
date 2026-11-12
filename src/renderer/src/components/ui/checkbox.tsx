import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { CheckIcon } from '@radix-ui/react-icons'

const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ')

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => {
  const theme = 'green'
  const themeClasses = {
    blue: 'data-[state=checked]:bg-[#C0443C]',
    green: 'data-[state=checked]:bg-[#C0443C]',
    purple: 'data-[state=checked]:bg-[#7F56D9]'
  }

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        'peer h-[16px] w-[16px] shrink-0 rounded-[4px] border border-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-none dark:data-[state=checked]:text-current',
        themeClasses[theme],
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn('flex items-center justify-center text-current')}
        style={{ color: '#ffffff' }}
      >
        <CheckIcon className="h-4 w-4" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
})

Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
