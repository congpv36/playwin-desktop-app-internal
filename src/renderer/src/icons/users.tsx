import PropTypes from 'prop-types'

const UsersICon = ({ className }) => (
  <svg
    width="52"
    height="53"
    viewBox="0 0 52 53"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className}`}
  >
    <g filter="url(#filter0_d_1057_1058)">
      <path
        d="M2 13.5C2 6.87258 7.37258 1.5 14 1.5H38C44.6274 1.5 50 6.87258 50 13.5V37.5C50 44.1274 44.6274 49.5 38 49.5H14C7.37258 49.5 2 44.1274 2 37.5V13.5Z"
        fill="#FFFFFF"
        shapeRendering="crispEdges"
      />
      <path
        d="M14 2H38C44.3513 2 49.5 7.14873 49.5 13.5V37.5C49.5 43.8513 44.3513 49 38 49H14C7.64873 49 2.5 43.8513 2.5 37.5V13.5C2.5 7.14873 7.64873 2 14 2Z"
        stroke="#D5D7DA"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M36 34.5V32.5C36 30.6362 34.7252 29.0701 33 28.626M29.5 16.7908C30.9659 17.3841 32 18.8213 32 20.5C32 22.1787 30.9659 23.6159 29.5 24.2092M31 34.5C31 32.6362 31 31.7044 30.6955 30.9693C30.2895 29.9892 29.5108 29.2105 28.5307 28.8045C27.7956 28.5 26.8638 28.5 25 28.5H22C20.1362 28.5 19.2044 28.5 18.4693 28.8045C17.4892 29.2105 16.7105 29.9892 16.3045 30.9693C16 31.7044 16 32.6362 16 34.5M27.5 20.5C27.5 22.7091 25.7091 24.5 23.5 24.5C21.2909 24.5 19.5 22.7091 19.5 20.5C19.5 18.2909 21.2909 16.5 23.5 16.5C25.7091 16.5 27.5 18.2909 27.5 20.5Z"
        stroke="#CECFD2"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <filter
        id="filter0_d_1057_1058"
        x="0"
        y="0.5"
        width="52"
        height="52"
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
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1057_1058" />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_1057_1058"
          result="shape"
        />
      </filter>
    </defs>
  </svg>
)
UsersICon.propTypes = {
  className: PropTypes.string
}

export default UsersICon
