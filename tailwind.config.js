/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary Palette
        'tea-green': {
          DEFAULT: '#2D5016',
          light: '#4A7C2C',
        },
        'mist-gray': '#B8C5D6',
        'warm-cream': '#F5F0E8',
        'soft-white': '#FDFDFB',
        'earth-brown': '#6B5544',
        
        // Accent Colors
        'sunrise-gold': '#D4A574',
        'muted-olive': '#8B8C5A',
        
        // Text Colors
        'text-primary': '#2D3436',
        'text-secondary': '#636E72',
        
        // Semantic Colors
        success: '#4A7C2C',
        warning: '#D4A574',
        error: '#D63031',
        info: '#B8C5D6',
      },
      
      fontFamily: {
        display: ['Georgia', 'Times New Roman', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      
      fontSize: {
        'hero': ['72px', { lineHeight: '1.2', fontWeight: '500' }],
        'h1': ['48px', { lineHeight: '1.3', fontWeight: '600' }],
        'h2': ['36px', { lineHeight: '1.4', fontWeight: '600' }],
        'h3': ['28px', { lineHeight: '1.5', fontWeight: '600' }],
        'body-large': ['20px', { lineHeight: '1.6', fontWeight: '400' }],
        'body': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'caption': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
      },
      
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      
      backdropBlur: {
        'glass': '12px',
      },
      
      borderRadius: {
        'glass': '12px',
        'pill': '24px',
      },
      
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'elevation': '0 4px 16px rgba(0, 0, 0, 0.12)',
      },
      
      animation: {
        'mist-drift': 'mistDrift 15s ease-in-out infinite',
        'leaf-sway': 'leafSway 25s ease-in-out infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      
      keyframes: {
        mistDrift: {
          '0%, 100%': { opacity: '0.6', transform: 'translateX(0)' },
          '50%': { opacity: '0.8', transform: 'translateX(10px)' },
        },
        leafSway: {
          '0%, 100%': { transform: 'rotate(-1deg)' },
          '50%': { transform: 'rotate(1deg)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      
      maxWidth: {
        'site': '1440px',
        'content': '1200px',
      },
    },
  },
  plugins: [],
};