import PropTypes from 'prop-types'

const BookOpenBorder = ({ className }) => (
  <svg
    width="52"
    height="53"
    viewBox="0 0 52 53"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className}`}
  >
    <g filter="url(#filter0_d_922_5158)">
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
        d="M26 34.5L25.8999 34.3499C25.2053 33.308 24.858 32.787 24.3991 32.4098C23.9929 32.0759 23.5248 31.8254 23.0216 31.6726C22.4533 31.5 21.8271 31.5 20.5748 31.5H19.2C18.0799 31.5 17.5198 31.5 17.092 31.282C16.7157 31.0903 16.4097 30.7843 16.218 30.408C16 29.9802 16 29.4201 16 28.3V19.7C16 18.5799 16 18.0198 16.218 17.592C16.4097 17.2157 16.7157 16.9097 17.092 16.718C17.5198 16.5 18.0799 16.5 19.2 16.5H19.6C21.8402 16.5 22.9603 16.5 23.816 16.936C24.5686 17.3195 25.1805 17.9314 25.564 18.684C26 19.5397 26 20.6598 26 22.9M26 34.5V22.9M26 34.5L26.1001 34.3499C26.7947 33.308 27.142 32.787 27.6009 32.4098C28.0071 32.0759 28.4752 31.8254 28.9784 31.6726C29.5467 31.5 30.1729 31.5 31.4252 31.5H32.8C33.9201 31.5 34.4802 31.5 34.908 31.282C35.2843 31.0903 35.5903 30.7843 35.782 30.408C36 29.9802 36 29.4201 36 28.3V19.7C36 18.5799 36 18.0198 35.782 17.592C35.5903 17.2157 35.2843 16.9097 34.908 16.718C34.4802 16.5 33.9201 16.5 32.8 16.5H32.4C30.1598 16.5 29.0397 16.5 28.184 16.936C27.4314 17.3195 26.8195 17.9314 26.436 18.684C26 19.5397 26 20.6598 26 22.9"
        stroke="#D5D7DA"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <filter
        id="filter0_d_922_5158"
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
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_922_5158" />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_922_5158"
          result="shape"
        />
      </filter>
    </defs>
  </svg>
)
BookOpenBorder.propTypes = {
  className: PropTypes.string
}

export default BookOpenBorder
