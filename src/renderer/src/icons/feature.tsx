import PropTypes from 'prop-types'

const Feature = ({ className }) => (
  <svg
    width="44"
    height="44"
    viewBox="0 0 44 44"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className}`}
  >
    <g filter="url(#filter0_d_840_4325)">
      <path
        d="M2 9C2 4.58172 5.58172 1 10 1H34C38.4183 1 42 4.58172 42 9V33C42 37.4183 38.4183 41 34 41H10C5.58172 41 2 37.4183 2 33V9Z"
        fill="#0C0E12"
        shapeRendering="crispEdges"
      />
      <path
        d="M10 1.5H34C38.1421 1.5 41.5 4.85786 41.5 9V33C41.5 37.1421 38.1421 40.5 34 40.5H10C5.85786 40.5 2.5 37.1421 2.5 33V9C2.5 4.85786 5.85786 1.5 10 1.5Z"
        stroke="#22262F"
        shapeRendering="crispEdges"
      />
      <g clipPath="url(#clip0_840_4325)">
        <path
          d="M25.3327 20.9998L21.9993 17.6665M21.9993 17.6665L18.666 20.9998M21.9993 17.6665V24.3332M30.3327 20.9998C30.3327 25.6022 26.6017 29.3332 21.9993 29.3332C17.397 29.3332 13.666 25.6022 13.666 20.9998C13.666 16.3975 17.397 12.6665 21.9993 12.6665C26.6017 12.6665 30.3327 16.3975 30.3327 20.9998Z"
          stroke="#CECFD2"
          strokeWidth="1.67"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </g>
    <defs>
      <filter
        id="filter0_d_840_4325"
        x="0"
        y="0"
        width="44"
        height="44"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy="1" />
        <feGaussianBlur stdDeviation="1" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.0392157 0 0 0 0 0.0509804 0 0 0 0 0.0705882 0 0 0 0.05 0"
        />
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_840_4325" />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_840_4325"
          result="shape"
        />
      </filter>
      <clipPath id="clip0_840_4325">
        <rect width="20" height="20" fill="white" transform="translate(12 11)" />
      </clipPath>
    </defs>
  </svg>
)
Feature.propTypes = {
  className: PropTypes.string
}

export default Feature
