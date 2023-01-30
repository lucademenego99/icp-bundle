import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        outDir: 'dist/base/',
        emptyOutDir: false,
        lib: {
            entry: 'src/exports/cpp-offline.ts',
            formats: ['iife'],
            fileName: 'cpp',
            name: 'CppCodePlayground',
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