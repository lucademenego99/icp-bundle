import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import html from "rollup-plugin-html";
import css from "rollup-plugin-import-css";
import { terser } from 'rollup-plugin-terser';

// Check if we are in production mode
const production = !process.env.CURRENT_ENV;

export default {
    input: "src/index.js",
    output: {
        format: "iife",
        name: "CodeMirror",
        file: "dist/icp.bundle.js",
        inlineDynamicImports: true
    },
    plugins: [
        nodeResolve({ browser: true }),
        commonjs(),
        typescript(),
        // include all html templates as js variables
        html({
            include: "**/*.html",
            htmlMinifierOptions: { collapseWhitespace: true, collapseBooleanAttributes: true, conservativeCollapse: true, minifyJS: true }
        }),
        // include all css files as js variables
        css({
            minify: true
        }),
        // minify everything if we are in production
        production && terser()
    ]
}