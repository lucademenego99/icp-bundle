import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        outDir: 'src/modules/workers/cpp',
        emptyOutDir: false,
        lib: {
            entry: 'src/modules/workers/cpp/cppWorker.ts',
            formats: ['iife'],
            fileName: 'cppWorkerBundle',
            name: 'CppWorker',
        }
    },
});