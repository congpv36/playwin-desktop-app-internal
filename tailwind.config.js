/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}'
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        // PlayWin Internal theme (do gach diu). Brand accent khác app chính (xanh lá)
        'brand-color': '#C0443C',
        'layout-color': '#EEEAE9',
        'color-hover': '#22262F',

        'blue-color': '#155EEF',
        'gray-color': '#D1D5DB',
        'red-color': '#FF0000',
        'green-color': '#14B800',
        'yellow-color': '#FEC84B',
        'orange-color': '#FF8C00',

        'primary-color': 'var(--primary-color)',
        'secondary-color': 'var(--secondary-color)',
        hover: {
          default: '#E5DDDB'
        },
        border: {
          default: '#D8CDCB'
        },
        text: {
          default: '#181D27'
        },
        bg: {
          gray: '#13161B'
        }
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },

  plugins: [require('tailwindcss-animate')]
}
