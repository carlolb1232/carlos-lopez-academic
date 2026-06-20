import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17212b",
        muted: "#607080",
        paper: "#f7f4ec",
        moss: "#526a4d",
        copper: "#a64f2d",
        ocean: "#22577a",
        gold: "#b98524",
      },
      boxShadow: {
        soft: "0 18px 60px rgba(23, 33, 43, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
