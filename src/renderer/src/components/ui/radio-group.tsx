import * as React from 'react'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'

const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ')

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return <RadioGroupPrimitive.Root className={cn('gap-2', className)} {...props} ref={ref} />
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  const theme = 'green'
  const themeClasses = {
    blue: 'data-[state=checked]:border-[#C0443C] data-[state=checked]:text-[#C0443C]',
    green: 'data-[state=checked]:border-[#C0443C] data-[state=checked]:text-[#C0443C]',
    purple: 'data-[state=checked]:border-[#7F56D9] data-[state=checked]:text-[#7F56D9]'
  }

  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        'aspect-square h-4 w-4 rounded-full border data-[state=checked]:bg-white border-[#373A41] focus:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-[5px]',
        themeClasses[theme],
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        {/* The indicator is the colored border when checked */}
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
