import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Pozwala na połączenia z każdego linku (super wygodne przy ngroku)
    allowedHosts: true
  }
})