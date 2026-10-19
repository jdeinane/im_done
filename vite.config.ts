import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // '/' pour Vercel/Netlify ; sous-chemin pour GitHub Pages (ex. VITE_BASE=/im_done/).
  base: process.env.VITE_BASE ?? '/',
})
