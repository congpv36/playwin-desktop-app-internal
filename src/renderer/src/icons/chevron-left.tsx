import PropTypes from 'prop-types'

const ChevronLeft = ({ className }) => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className}`}
  >
    <path
      d="M6 0.5H26C29.0376 0.5 31.5 2.96243 31.5 6V26C31.5 29.0376 29.0376 31.5 26 31.5H6C2.96243 31.5 0.5 29.0376 0.5 26V6C0.5 2.96243 2.96243 0.5 6 0.5Z"
      fill="#FFFFFF"
    />
    <path
      d="M6 0.5H26C29.0376 0.5 31.5 2.96243 31.5 6V26C31.5 29.0376 29.0376 31.5 26 31.5H6C2.96243 31.5 0.5 29.0376 0.5 26V6C0.5 2.96243 2.96243 0.5 6 0.5Z"
      stroke="#D5D7DA"
    />
    <path
      d="M18.5 21L13.5 16L18.5 11"
      stroke="#61656C"
      strokeWidth="2.004"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
ChevronLeft.propTypes = {
  className: PropTypes.string
}

export default ChevronLeft
