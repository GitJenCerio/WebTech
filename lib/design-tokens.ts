export const colors = {
  brand: {
    black: '#000000',
    white: '#FFFFFF',
  },
  gray: {
    50: '#f8f9fa',
    100: '#f1f3f5',
    200: '#e9ecef',
    300: '#dee2e6',
    400: '#ced4da',
    500: '#adb5bd',
    600: '#6c757d',
    700: '#495057',
    800: '#343a40',
    900: '#212529',
  },
  success: {
    light: '#d4edda',
    DEFAULT: '#28a745',
    dark: '#155724',
  },
  warning: {
    light: '#fff3cd',
    DEFAULT: '#ffc107',
    dark: '#856404',
  },
  danger: {
    light: '#f8d7da',
    DEFAULT: '#dc3545',
    dark: '#721c24',
  },
  info: {
    light: '#d1ecf1',
    DEFAULT: '#17a2b8',
    dark: '#0c5460',
  },
} as const;

export const fonts = {
  heading: ['var(--font-playfair)', 'serif'],
  body: ['var(--font-lato)', 'sans-serif'],
  decorative: {
    balgor: ['var(--font-balgor)', 'sans-serif'],
    acollia: ['var(--font-acollia)', 'sans-serif'],
    ladinta: ['var(--font-ladinta)', 'sans-serif'],
  },
} as const;

export const spacing = {
  xs: '0.5rem',
  sm: '0.75rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
} as const;

export const borderRadius = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  full: '9999px',
} as const;
