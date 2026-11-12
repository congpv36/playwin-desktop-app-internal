import PropTypes from 'prop-types'

const QuestionMarkCircle = ({ className = '' }) => {
  const sizeClass = className.match(/size-\d+/g)?.[0] || 'size-6'

  const otherClasses = className
    .split(' ')
    .filter((cls) => !cls.match(/size-\d+/))
    .join(' ')

  const finalClassName = `${sizeClass} ${otherClasses} text-brand-color`.trim()

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      strokeWidth="1.5"
      className={finalClassName}
    >
      <path
        fillRule="evenodd"
        d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0Zm-6 3.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM7.293 5.293a1 1 0 1 1 .99 1.667c-.459.134-1.033.566-1.033 1.29v.25a.75.75 0 1 0 1.5 0v-.115a2.5 2.5 0 1 0-2.518-4.153.75.75 0 1 0 1.061 1.06Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

QuestionMarkCircle.propTypes = {
  className: PropTypes.string
}

export default QuestionMarkCircle
