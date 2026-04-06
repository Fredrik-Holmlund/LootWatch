import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // GitHub Pages serves from /LootWatch/ — use '/' for local dev or custom domain
  base: process.env.GITHUB_ACTIONS ? '/LootWatch/' : '/',
})
