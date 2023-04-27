import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  base: "https://carlosAndress101.github.io/rick-and-morty/",
  plugins: [react()],
})
