import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#07111f",
          900: "#0b1728",
          850: "#101d2f",
        },
        graphite: {
          950: "#101318",
          900: "#171b22",
          850: "#1d232d",
          800: "#252c37",
        },
        signal: {
          orange: "#ff7a1a",
          amber: "#f5b642",
          green: "#30d158",
          red: "#ff453a",
          blue: "#4da3ff",
        },
      },
      boxShadow: {
        industrial: "0 18px 60px rgba(0,0,0,.38)",
      },
    },
  },
  plugins: [],
};

export default config;
