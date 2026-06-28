import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Marca Compás — violeta/índigo con acento cálido de baile.
        brand: {
          50: "#f3f1ff",
          100: "#e9e5ff",
          200: "#d5ccff",
          300: "#b7a6ff",
          400: "#9575ff",
          500: "#7c4dff",
          600: "#6d35f5",
          700: "#5d24d8",
          800: "#4d1eae",
          900: "#401d8c",
        },
        ink: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        // Roles de baile (consistentes en toda la app).
        leader: "#2563eb",
        follower: "#db2777",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
