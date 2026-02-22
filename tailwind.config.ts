import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    // Safelist nail tech color classes to prevent purging in production
    // Use pattern matching to ensure all variations are included
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    {
      pattern: /^(bg|text|border)-(blue|purple|pink|indigo|teal|amber|rose|cyan|emerald|violet|fuchsia|orange|lime|sky|yellow)-(500|700|900)$/,
    },
    {
      pattern: /^shadow-(blue|purple|pink|indigo|teal|amber|rose|cyan|emerald|violet|fuchsia|orange|lime|sky|yellow)-500\/50$/,
    },
    'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
    'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-violet-500',
    'bg-fuchsia-500', 'bg-orange-500', 'bg-lime-500', 'bg-sky-500', 'bg-yellow-500',
    'text-white', 'text-slate-900',
    'border-blue-700', 'border-purple-700', 'border-pink-700', 'border-indigo-700',
    'border-teal-700', 'border-amber-700', 'border-rose-700', 'border-cyan-700',
    'border-emerald-700', 'border-violet-700', 'border-fuchsia-700', 'border-orange-700',
    'border-lime-700', 'border-sky-700', 'border-yellow-700',
    'shadow-lg', 'shadow-blue-500/50', 'shadow-purple-500/50', 'shadow-pink-500/50',
    'shadow-indigo-500/50', 'shadow-teal-500/50', 'shadow-amber-500/50', 'shadow-rose-500/50',
    'shadow-cyan-500/50', 'shadow-emerald-500/50', 'shadow-violet-500/50',
    'shadow-fuchsia-500/50', 'shadow-orange-500/50', 'shadow-lime-500/50',
    'shadow-sky-500/50', 'shadow-yellow-500/50',
  ],
  theme: {
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        charcoal: {
          DEFAULT: "#1a1a1a",
          light: "#2d2d2d",
        },
      },
      boxShadow: {
        sm: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        md: "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
        lg: "0 8px 24px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.06)",
        card: "0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
        hover: "0 6px 16px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)",
      },
      fontFamily: {
        heading: ['Balgor', 'sans-serif'],
        body: ['var(--font-jost)', 'Jost', 'sans-serif'],
        sans: ['var(--font-jost)', 'Jost', 'sans-serif'],
        balgor: ['Balgor', 'sans-serif'],
        acollia: ['Acollia', 'sans-serif'],
        ladinta: ['Ladinta', 'sans-serif'],
      },
      spacing: {
        xs: '0.5rem',
        sm: '0.75rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        full: '9999px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
