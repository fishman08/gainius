import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/core/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-elevated": "var(--surface-elevated)",
        border: "var(--surface-border)",
        fg: "var(--fg)",
        "fg-secondary": "var(--fg-secondary)",
        "fg-hint": "var(--fg-hint)",
        primary: "var(--primary)",
        "primary-text": "var(--primary-text)",
        "primary-muted": "var(--primary-muted)",
        accent: "var(--accent)",
        success: "var(--success)",
        error: "var(--error)",
        "input-bg": "var(--input-bg)",
        "input-border": "var(--input-border)",
        // Raw brand tokens
        "brand-50": "var(--brand-orange-50)",
        "brand-100": "var(--brand-orange-100)",
        "brand-300": "var(--brand-orange-300)",
        "brand-400": "var(--brand-orange-400)",
        "brand-500": "var(--brand-orange-500)",
        "brand-600": "var(--brand-orange-600)",
        "brand-900": "var(--brand-orange-900)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        sm: "8px",
        md: "14px",
        lg: "20px",
        xl: "28px",
        full: "9999px",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        glow: "var(--shadow-glow)",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
        "3xl": "64px",
      },
      backgroundImage: {
        gradient: "var(--gradient)",
      },
    },
  },
  plugins: [],
};

export default config;
