import PropTypes from 'prop-types'

const LogOut02 = ({ className }) => (
  <svg
    className={`${className}`}
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0 24C0 10.7452 10.7452 0 24 0C37.2548 0 48 10.7452 48 24C48 37.2548 37.2548 48 24 48C10.7452 48 0 37.2548 0 24Z"
      fill="#FEF3F2"
    />
    <path
      d="M28 19L33 24L28 29M33 24H21M24 29C24 29.93 24 30.395 23.8978 30.7765C23.6204 31.8117 22.8117 32.6204 21.7765 32.8978C21.395 33 20.93 33 20 33H19.5C18.1022 33 17.4033 33 16.8519 32.7716C16.1169 32.4672 15.5328 31.8831 15.2284 31.1481C15 30.5967 15 29.8978 15 28.5V19.5C15 18.1022 15 17.4033 15.2284 16.8519C15.5328 16.1169 16.1169 15.5328 16.852 15.2284C17.4033 15 18.1022 15 19.5 15H20C20.93 15 21.395 15 21.7765 15.1022C22.8117 15.3796 23.6204 16.1883 23.8978 17.2235C24 17.605 24 18.07 24 19"
      stroke="#D92D20"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
LogOut02.propTypes = {
  className: PropTypes.string
}

export default LogOut02
