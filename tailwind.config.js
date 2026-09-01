/** @type {import('tailwindcss').Config} */
module.exports = { 
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"], 
  theme: { 
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        serif: ['var(--font-fraunces)', 'serif'],
      },
    } 
  }, 
  plugins: [] 
};