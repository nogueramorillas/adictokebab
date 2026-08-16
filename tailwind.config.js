/**
 * Tailwind v4 reads its theme from `src/index.css` (the `@theme` block).
 * This file is wired via `@config` in that CSS file and is the place to add
 * your own content globs or theme extensions if you prefer JS configuration.
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
