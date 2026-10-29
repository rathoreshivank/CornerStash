import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vite config: enables React JSX transform and Tailwind CSS
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
