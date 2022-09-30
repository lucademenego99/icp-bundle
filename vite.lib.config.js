import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        outDir: './dist/base/',
        emptyOutDir: true,
        lib: {
            entry: './src/main.ts',
            name: 'InteractiveCodePlaygrounds',
        },
        rollupOptions: {
            input: ["./src/exports/python.ts", "./src/exports/javascript.ts", "./src/exports/typescript.ts"],
            output: {
                format: 'iife',
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