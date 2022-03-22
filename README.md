# Interactive Code Playgrounds Bundle

Interactive Code Playgrounds Bundle is a Javascript plugin for embedding interactive code playgrounds in html pages.

The editor used in these playgrounds is CodeMirror, an in-browser editor distributed as a collection of modules that aren't directly loadable by the browser.

Rollup is a tool that takes a given main script (or multiple ones) and produces a new script that has all of the script's dependencies included. This makes it easier to run modern Javascript systems in the browser, and with this approach we are able to export a completely customized CodeMirror instance.

The main script that Rollup uses is `src/index.js`. We can easily run Rollup using:
```
npm install     # Install all the packages
npm run build   # Build the module
```

This command will generate a file `icp.bundle.js` that can be used in modern web browsers just by importing it with:
```<script src='icp.bundle.js></script>'```

This file exports the following web components:
- **`<{language}-editor />`**: base editor, light mode;
- **`<{language}-editor-dark />`**: base editor, dark mode;
- **`<{language}-editor-v />`**: vertical editor, light mode;
- **`<{language}-editor-v-dark />`**: vertical editor, dark mode;
- **`<{language}-editor-tabs-dark />`**: editor with three tabs for code, input and output, dark mode.

The available languages that can be put inside `{language}` are the following:
|  | Syntax Highlighting | Lint Checks | Run Code |
| --- | :---: | :---: | :---: |
| javascript | ✅ | ✅ | ✅ |
| typescript | ✅ | ✅ | ✅ |
| java | ✅ |  |  |
| cpp | ✅ |  |  |

Apart from these web components, `icp.bundle.js` exposes the following set of functions:
- `createEditor(element, language, enableDarkMode, initialText)`: create a CodeMirror editor, returning its instance and a languageConfiguration compartment useful to change language at runtime;
- `setJavascript(editor, languageConfiguration)`: change the editor's language to Javascript using the provided compartment;
- `setTypescript(editor, languageConfiguration)`: change the editor's language to Typescript using the provided compartment;
- `setCpp(editor, languageConfiguration)`: change the editor's language to C++ using the provided compartment;
- `setJava(editor, languageConfiguration)`: change the editor's language to Java using the provided compartment.

The typescript plugin included in `src/modules/` has been taken from [prisma/text-editors](https://github.com/prisma/text-editors), as well as `scripts/build-types.mjs`, and they mainly allow us to do spell checking on typescript code.
