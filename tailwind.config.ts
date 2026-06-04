import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#FFFFFF",
        card: "#F8F9FA",
        "card-hover": "#F0F1F3",
        text: {
          primary: "#1A1A1A",
          secondary: "#5F6368",
          muted: "#9AA0A6",
        },
        accent: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
          soft: "#EFF6FF",
        },
        success: "#16A34A",
        warning: "#D97706",
        danger: "#DC2626",
        border: "#E5E7EB",
      },
      spacing: {
        xs: "8px",
        sm: "12px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
      },
      fontSize: {
        tiny: ["12px", { lineHeight: "1.4" }],
        sm: ["14px", { lineHeight: "1.5" }],
        base: ["16px", { lineHeight: "1.6" }],
        lg: ["18px", { lineHeight: "1.5" }],
        h2: ["22px", { lineHeight: "1.3" }],
        h1: ["32px", { lineHeight: "1.2" }],
        "h1-desktop": ["36px", { lineHeight: "1.2" }],
      },
      minHeight: {
        btn: "56px",
      },
      minWidth: {
        btn: "56px",
      },
      borderRadius: {
        btn: "12px",
        card: "16px",
      },
      maxWidth: {
        page: "640px",
      },
    },
  },
  plugins: [],
};

export default config;
