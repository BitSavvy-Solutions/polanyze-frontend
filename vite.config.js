import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      // "unsafe-none" disables the strict isolation that blocks Google's popup
      "Cross-Origin-Embedder-Policy": "unsafe-none",
      // "same-origin-allow-popups" allows the Google Sign-In popup to communicate back to the app
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },
})