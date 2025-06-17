import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "Noto Color Emoji",
        ],
      },
      colors: {
        primary: "var(--primary, #3B82F6)",
        secondary: "var(--secondary, #8B5CF6)",
        success: "var(--success, #10B981)",
        warning: "var(--warning, #F59E0B)",
        error: "var(--error, #EF4444)",
        background: "var(--background, #FFFFFF)",
        surface: "var(--surface, #F3F4F6)",
        text: "var(--text, #1F2937)",
      },
      perspective: {
        '1000': '1000px',
      },
      transformStyle: {
        'preserve-3d': 'preserve-3d',
      },
      backfaceVisibility: {
        'hidden': 'hidden',
      },
      rotate: {
        'y-180': 'rotateY(180deg)',
      },
    },
  },
  plugins: [
    function({ addUtilities }: { addUtilities: any }) {
      addUtilities({
        '.perspective-1000': {
          perspective: '1000px',
        },
        '.transform-style-preserve-3d': {
          'transform-style': 'preserve-3d',
        },
        '.backface-hidden': {
          'backface-visibility': 'hidden',
        },
        '.rotate-y-180': {
          transform: 'rotateY(180deg)',
        },
      })
    }
  ],
} satisfies Config;
