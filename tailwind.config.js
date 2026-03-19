/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dungeon: {
          bg: "#0a0a0f",
          surface: "#12121a",
          border: "#2a2a3a",
          gold: "#c9a84c",
          "gold-light": "#f0d080",
          crimson: "#8b1a1a",
          "crimson-light": "#c0392b",
          mana: "#1a3a8b",
          "mana-light": "#4a90e2",
          hp: "#1a5c1a",
          "hp-light": "#2ecc71",
          xp: "#5c4a1a",
          "xp-light": "#f39c12",
          text: "#e8e0d0",
          "text-dim": "#8a8070",
        },
      },
      fontFamily: {
        display: ["'Cinzel'", "serif"],
        body: ["'Crimson Text'", "serif"],
        mono: ["'Share Tech Mono'", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shake: "shake 0.4s ease-in-out",
        "float-up": "floatUp 1s ease-out forwards",
      },
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px)" },
          "75%": { transform: "translateX(4px)" },
        },
        floatUp: {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(-40px)" },
        },
      },
    },
  },
  plugins: [],
};
