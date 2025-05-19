/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
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
