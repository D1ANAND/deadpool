import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      colors: {
        neon: {
          blue: "#6366f1",
          purple: "#a855f7",
          cyan: "#22d3ee",
          green: "#22c55e",
        },
      },
      boxShadow: {
        "neon-blue": "0 0 20px rgba(99,102,241,0.4), 0 0 60px rgba(99,102,241,0.15)",
        "neon-purple": "0 0 20px rgba(168,85,247,0.4), 0 0 60px rgba(168,85,247,0.15)",
        "neon-green": "0 0 20px rgba(34,197,94,0.4), 0 0 60px rgba(34,197,94,0.15)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      animation: {
        "spin-slow": "spin 3s linear infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
