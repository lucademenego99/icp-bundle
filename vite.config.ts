import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        customElement: true,
      },
      onwarn: (warning, handler) => {
        if (warning.code === 'css-unused-selector') return
        handler(warning)
      }
    })
  ],
})
