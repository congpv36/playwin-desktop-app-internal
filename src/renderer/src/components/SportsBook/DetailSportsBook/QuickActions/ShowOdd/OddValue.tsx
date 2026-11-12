import { memo } from 'react'

export const OddValue = memo(function OddValue({
  value,
  isChanged
}: {
  value: number
  isChanged: boolean
}) {
  return (
    <span
      className={`font-semibold rounded px-0.5 transition-colors duration-700 ${
        value < 0 ? 'text-red-color' : ''
      } ${isChanged ? 'bg-yellow-200' : 'bg-transparent'}`}
    >
      {value.toFixed(3)}
    </span>
  )
})
