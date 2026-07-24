import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#172a24",
        forest: "#1f5948",
        leaf: "#78a66a",
        cream: "#f7f4eb",
        sun: "#edb74d",
        coral: "#df765e"
      },
      boxShadow: {
        soft: "0 20px 50px rgba(28, 58, 48, 0.10)",
      },
    },
  },
  plugins: [],
} satisfies Config;

