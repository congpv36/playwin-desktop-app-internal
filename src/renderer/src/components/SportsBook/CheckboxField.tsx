import React from 'react'
import { twMerge } from 'tailwind-merge'

import { Checkbox } from '@renderer/components/ui/checkbox'

const CheckboxField = ({ id, label, checked, className, onChange }) => {
  return (
    <div className={twMerge(`flex items-center pr-3 ${className}`)}>
      <Checkbox
        id={id}
        className="data-[state=checked]:text-zinc-900 "
        checked={checked}
        onCheckedChange={onChange}
      />
      <label htmlFor={id} className="pl-[2px] cursor-pointer">
        {label}
      </label>
    </div>
  )
}
export default React.memo(CheckboxField)
