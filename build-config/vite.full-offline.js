import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        outDir: 'dist/base/',
        emptyOutDir: false,
        lib: {
            entry: 'src/exports/full-offline.ts',
            formats: ['iife'],
            fileName: 'full-offline',
            name: 'InteractiveCodePlaygrounds',
        },
        rollupOptions: {
            output: {
                inlineDynamicImports: true,
            }
        }
    },
    plugins: [svelte({
        compilerOptions: {
            customElement: true
        }
    })]
})