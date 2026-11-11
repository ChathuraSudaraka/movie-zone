/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Warm earthy taupe-bronze + monochromatic silver scale
        brand: {
          50: "#F7F5F2",
          100: "#ECE8E1",
          200: "#DED8CE",
          300: "#D0C7B9",
          400: "#B8AEA0",
          500: "#918477",
          600: "#5E554C",
          700: "#463F39",
          800: "#312C28",
          900: "#1F1C19",
          950: "#12100E",
        },
        // Monochromatic silver highlights
        accent: {
          400: "#E4E4E7",
          500: "#D4D4D8",
          600: "#A1A1AA",
        },
        // Deep obsidian / smoked charcoal surfaces
        ink: {
          950: "#050507",
          900: "#0A0A0D",
          850: "#0F0F13",
          800: "#15151A",
          700: "#1D1D24",
          600: "#2A2A32",
          500: "#3A3A44",
        },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "SF Pro Text", "Inter", "system-ui", "sans-serif"],
        display: ["-apple-system", "BlinkMacSystemFont", "SF Pro Display", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 8px 24px -6px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)",
        "glow-lg": "0 24px 48px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.14)",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        ios: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
      keyframes: {
        "blob-drift": {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "33%": { transform: "translate3d(6%, -8%, 0) scale(1.1)" },
          "66%": { transform: "translate3d(-5%, 6%, 0) scale(0.95)" },
        },
        "ken-burns": {
          "0%": { transform: "scale(1.05) translate3d(0,0,0)" },
          "100%": { transform: "scale(1.18) translate3d(-2%, -2%, 0)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-120%) skewX(-20deg)" },
          "100%": { transform: "translateX(220%) skewX(-20deg)" },
        },
      },
      animation: {
        "blob-drift": "blob-drift 22s ease-in-out infinite",
        "ken-burns": "ken-burns 24s ease-out infinite alternate",
        shimmer: "shimmer 1.1s ease-out",
      },
      transformOrigin: {
        gpu: "translate3d(0,0,0)",
      },
      height: {
        'screen-dynamic': '100dvh',
      },
      padding: {
        'safe': 'env(safe-area-inset-bottom)',
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        'mac': '1512px',  // MacBook Pro 14" breakpoint
        '2xl': '1536px',
      },
    },
  },
  variants: {
    extend: {
      transform: ["hover", "focus", "group-hover"],
    },
  },
  plugins: [require("tailwind-scrollbar-hide"), require("tailwind-scrollbar")],
};
