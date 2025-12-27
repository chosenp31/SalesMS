import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // ステージ固有の色（動的クラス用）
    // 青（商談中）
    "bg-blue-50", "bg-blue-200", "bg-blue-500", "border-blue-500", "text-blue-700", "hover:bg-blue-50",
    // 黄（審査・申込中）
    "bg-yellow-50", "bg-yellow-200", "bg-yellow-500", "border-yellow-500", "text-yellow-700", "hover:bg-yellow-50",
    // 紫（下見・工事中）
    "bg-purple-50", "bg-purple-200", "bg-purple-500", "border-purple-500", "text-purple-700", "hover:bg-purple-50",
    // インディゴ（契約中）
    "bg-indigo-50", "bg-indigo-200", "bg-indigo-500", "border-indigo-500", "text-indigo-700", "hover:bg-indigo-50",
    // 緑（入金中）
    "bg-green-50", "bg-green-200", "bg-green-500", "border-green-500", "text-green-700", "hover:bg-green-50",
    // ティール（請求中）
    "bg-teal-50", "bg-teal-200", "bg-teal-500", "border-teal-500", "text-teal-700", "hover:bg-teal-50",
    // グレー（完了）
    "bg-gray-50", "bg-gray-200", "bg-gray-400", "bg-gray-500", "border-gray-500", "text-gray-700",
    // 赤（否決）
    "bg-red-50", "bg-red-200", "bg-red-500", "border-red-500", "text-red-700", "hover:bg-red-50",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
