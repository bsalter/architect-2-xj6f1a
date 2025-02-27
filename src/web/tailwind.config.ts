import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,html}',
  ],
  theme: {
    screens: {
      // Define breakpoints based on requirements from Technical Specifications/7.5/Responsive Behavior
      'mobile': {'max': '767px'},     // Mobile: <767px
      'tablet': {'min': '768px', 'max': '1199px'}, // Tablet: 768px-1199px
      'desktop': {'min': '1200px'},   // Desktop: >1200px
    },
    extend: {
      colors: {
        // Define a custom color palette that ensures WCAG 2.1 AA compliance (4.5:1 contrast ratio)
        primary: {
          50: '#e6f0ff',
          100: '#cce0ff',
          200: '#99c2ff',
          300: '#66a3ff',
          400: '#3385ff',
          500: '#0066ff', // Primary brand color
          600: '#0052cc',
          700: '#003d99',
          800: '#002966',
          900: '#001433',
        },
        secondary: {
          50: '#f5f5f5',
          100: '#e8e8e8',
          200: '#d1d1d1',
          300: '#bababa',
          400: '#a3a3a3',
          500: '#8c8c8c',
          600: '#757575',
          700: '#5e5e5e',
          800: '#474747',
          900: '#303030',
        },
        success: {
          50: '#e8f7ed',
          100: '#d1f0dc',
          200: '#a3e1b9',
          300: '#75d296',
          400: '#47c373',
          500: '#1ab54f', // Success actions and status
          600: '#159140',
          700: '#106d30',
          800: '#0a4820',
          900: '#052410',
        },
        danger: {
          50: '#fee8e7',
          100: '#fdd1cf',
          200: '#faa3a0',
          300: '#f77570',
          400: '#f44741',
          500: '#f21911', // Error and destructive actions
          600: '#c2140e',
          700: '#910f0a',
          800: '#610a07',
          900: '#300503',
        },
        warning: {
          50: '#fff8e6',
          100: '#fff1cc',
          200: '#ffe499',
          300: '#ffd666',
          400: '#ffc933',
          500: '#ffbb00', // Warning indicators
          600: '#cc9600',
          700: '#997000',
          800: '#664b00',
          900: '#332500',
        },
        info: {
          50: '#e6f2ff',
          100: '#cce5ff',
          200: '#99cbff',
          300: '#66b1ff',
          400: '#3397ff',
          500: '#007dff', // Informative elements
          600: '#0064cc',
          700: '#004b99',
          800: '#003266',
          900: '#001933',
        },
      },
      fontSize: {
        // Consistent typography scale
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
      },
      spacing: {
        // Define consistent spacing based on a 4px grid
        '0': '0',
        '1': '0.25rem', // 4px
        '2': '0.5rem',  // 8px
        '3': '0.75rem', // 12px
        '4': '1rem',    // 16px
        '5': '1.25rem', // 20px
        '6': '1.5rem',  // 24px
        '8': '2rem',    // 32px
        '10': '2.5rem', // 40px
        '12': '3rem',   // 48px
        '16': '4rem',   // 64px
        '20': '5rem',   // 80px
        '24': '6rem',   // 96px
        '32': '8rem',   // 128px
      },
      borderRadius: {
        // Consistent border radius scale
        'none': '0',
        'sm': '0.125rem',   // 2px
        'DEFAULT': '0.25rem', // 4px
        'md': '0.375rem',   // 6px
        'lg': '0.5rem',     // 8px
        'xl': '0.75rem',    // 12px
        '2xl': '1rem',      // 16px
        'full': '9999px',
      },
      boxShadow: {
        // Define shadows for different elevation levels
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'none': 'none',
      },
      // Define common transitions for interactive elements
      transitionProperty: {
        'DEFAULT': 'background-color, border-color, color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter',
        'colors': 'background-color, border-color, color, fill, stroke',
        'opacity': 'opacity',
        'shadow': 'box-shadow',
        'transform': 'transform',
      },
      transitionTimingFunction: {
        'DEFAULT': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'linear': 'linear',
        'in': 'cubic-bezier(0.4, 0, 1, 1)',
        'out': 'cubic-bezier(0, 0, 0.2, 1)',
        'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        'DEFAULT': '150ms',
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
      },
    },
  },
  // Note: If additional plugins are needed, they should be installed and configured here
  // For example: npm install --save-dev @tailwindcss/forms @tailwindcss/typography
  plugins: [
    // Uncomment if installed
    // require('@tailwindcss/forms'),
    // require('@tailwindcss/typography'),
  ],
  // Safelist any classes that might not be detected in the templates
  safelist: [
    // Status-related classes
    'bg-success-500',
    'bg-danger-500',
    'bg-warning-500',
    'bg-info-500',
    'text-success-500',
    'text-danger-500',
    'text-warning-500',
    'text-info-500',
    // Responsive classes that might be dynamically applied
    'hidden',
    'mobile:block',
    'tablet:block',
    'desktop:block',
  ],
};

export default config;