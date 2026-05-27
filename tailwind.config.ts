import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#071d36",
        forest: "#087a55",
        ember: "#ff6b25",
        gold: "#ffc414",
        paper: "#fbfcf8"
      },
      borderRadius: {
        tradia: "8px"
      }
    }
  },
  plugins: []
};

export default config;
