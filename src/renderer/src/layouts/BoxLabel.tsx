export default function BoxLabel({
  label,
  children,
  className,
  classNameLabel = 'bg-layout-color'
}) {
  return (
    <div className="relative h-full">
      <div
        className={`absolute font-semibold top-[-4px] left-2  bg-transparent ${classNameLabel} `}
      >
        {label}
      </div>
      <div className={`w-1/2 h-full  border border-border-default ${className}`}>{children}</div>
    </div>
  )
}
