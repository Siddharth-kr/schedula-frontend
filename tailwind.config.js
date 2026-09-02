/** @type {import('tailwindcss').Config} */
module.exports = { 
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"], 
  theme: { 
    extend: {
      colors: {
        primary: "var(--color-primary)",
        "primary-dark": "var(--color-primary-dark)",
        accent: "var(--color-accent)",
        success: "var(--color-success)",
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        border: "var(--color-border)",
        error: "var(--color-error)",
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        serif: ['var(--font-fraunces)', 'serif'],
      },
    } 
  }, 
  plugins: [] 
};