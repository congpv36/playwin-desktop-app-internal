import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ')

export const getThemeClass = (mode: 'bg' | 'text' | 'hover' = 'bg') => {
  if (mode === 'bg') {
    return 'bg-[#C0443C]'
  } else if (mode === 'hover') {
    return 'hover:bg-[#9A3530]'
  } else {
    return 'text-[#1EE600]'
  }
}

type Theme = 'blue' | 'green' | 'purple'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 dark:focus-visible:ring-slate-300',
  {
    variants: {
      variant: {
        default:
          'bg-slate-900 text-slate-50 shadow hover:bg-slate-900/90 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/90',
        destructive:
          'bg-red-500 text-slate-50 shadow-sm hover:bg-red-500/90 dark:bg-red-900 dark:text-slate-50 dark:hover:bg-red-900/90',
        outline:
          'border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800 dark:hover:text-slate-50',
        secondary:
          'bg-slate-100 text-slate-900 shadow-sm hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-800/80',
        ghost:
          'hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50',
        link: 'text-slate-900 underline-offset-4 hover:underline dark:text-slate-50',
        borderless: 'bg-transparent hover:bg-slate-100/10',
        'bordered-white': 'border border-gray-600 text-white hover:bg-gray-700/30',
        'plain-white': 'text-white bg-transparent'
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'borderless'
    | 'bordered-white'
    | 'plain-white'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    const theme: Theme = 'green'
    let themeClass = ''

    // Manually determine theme class based on variant and theme
    if (variant === 'default') {
      themeClass = 'bg-[#C0443C] text-white hover:bg-[#C0443C]/90'
    } else if (variant === 'outline') {
      themeClass = 'border border-[#C0443C] text-[#C0443C] hover:bg-[#C0443C]/10'
    } else if (variant === 'secondary') {
      themeClass = 'bg-[#FBE9E7] text-[#C0443C] hover:bg-[#FBE9E7]/80'
    } else if (variant === 'ghost') {
      themeClass = 'text-[#C0443C] hover:bg-[#C0443C]/10'
    } else if (variant === 'link') {
      themeClass = 'text-[#C0443C] underline-offset-4 hover:underline'
    } else if (variant === 'destructive') {
      themeClass = 'bg-red-500 text-white hover:bg-red-500/90'
    } else if (variant === 'borderless') {
      themeClass = 'text-[#C0443C] hover:bg-[#C0443C]/5'
    } else if (variant === 'bordered-white') {
      // Button có viền màu xám, chữ màu trắng
      themeClass = 'border'
    } else if (variant === 'plain-white') {
      // Button chỉ có màu chữ trắng, không border, không hover effect
      themeClass = 'text-white'
    }

    // Size classes
    let sizeClass = 'h-8 px-4 py-2' // default
    if (size === 'sm') sizeClass = 'h-8 rounded-md px-3 text-xs'
    else if (size === 'lg') sizeClass = 'h-10 rounded-md px-8'
    else if (size === 'icon') sizeClass = 'h-9 w-9'

    return (
      <Comp
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
          themeClass,
          sizeClass,
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
