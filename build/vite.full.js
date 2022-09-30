import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        outDir: 'dist/base/',
        emptyOutDir: true,
        lib: {
            entry: 'src/exports/full.ts',
            formats: ['iife'],
            fileName: 'full',
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