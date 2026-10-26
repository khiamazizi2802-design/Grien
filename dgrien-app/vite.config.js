import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// DGrien - Dedicated Driver & Fleet Operations App (Runs on Port 5175)
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
    ],
    server: {
        port: 5175,
        open: true
    }
})
