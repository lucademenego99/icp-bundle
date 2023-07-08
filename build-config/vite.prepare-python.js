import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        outDir: 'src/modules/workers',
        emptyOutDir: false,
        lib: {
            entry: 'src/modules/workers/pythonOfflineWorker.ts',
            formats: ['iife'],
            fileName: 'pythonWorkerBundle',
            name: 'PythonWorker',
        }
    },
});