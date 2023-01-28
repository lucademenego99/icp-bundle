import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        outDir: 'dist/base/',
        emptyOutDir: false,
        lib: {
            entry: 'src/exports/p5-and-processing.ts',
            formats: ['iife'],
            fileName: 'p5-and-processing',
            name: 'P5CodePlaygrounds',
        },
        rollupOptions: {
            output: {
                inlineDynamicImports: true,
            },
            transform(code) {
                const index = code.indexOf('"use strict";');
                const before = code.slice(0, index + '"use strict";'.length);
                const after = code.slice(index + '"use strict";'.length);
                return `${before}\nglobalThis.process = globalThis.process;\n${after}`;
            },
        }
    },
    plugins: [svelte({
        compilerOptions: {
            customElement: true
        }
    })]
})