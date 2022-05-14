# Interactive Code Playgrounds Bundle

Interactive Code Playgrounds Bundle is a plugin for embedding interactive code playgrounds in HTML pages.

The editor used in these playgrounds is [CodeMirror6](https://codemirror.net/6/), an in-browser editor distributed as a collection of modules.

The project is based on [Svelte](https://github.com/sveltejs/svelte), a compiler converting the exposed components in efficient JavaScript. The build, instead, is performed through [Vite](https://github.com/vitejs/vite) and the [gulp](https://github.com/gulpjs/gulp) tool.

## Examples
Some examples of this plugin can be found in the repository [icp-slides](https://github.com/lucademenego99/icp-slides). In particular, a presentation of the main elements this plugin exposes is hosted as a Github Pages website in [https://lucademenego99.github.io/icp-slides/editors.html](https://lucademenego99.github.io/icp-slides/editors.html)

## Installation

The main script that Vite uses is `src/main.ts`. First of all, install all the packages:
```
npm install
```

Then you can build the module with:
```
npm run gulp
```

or run a demo with:
```
npm run dev
```

The build command will generate two folders:
- **base**: build comprehending the files `dist/icp-bundle.es.js`, `dist/icp-bundle.umd.js`, a folder `utils` containing all the assets the bundle needs and an example HTML page;
- **offline**: a specially crafted build that can be distributed to be run without an internet connection. [redbean.com](https://redbean.dev/) is a simple HTTP server that exposes the current folder. It can be executed on Linux, MacOS, Windows, FreeBSD, OpenBSD and NetBSD thanks to the [Cosmopolitan project](https://github.com/jart/cosmopolitan).

To use the exposed web components and functions in an HTML page you can simply import the script:
```<script src='icp-bundle.umd.js></script>'```

## Web Components

The bundle exports the following web components:
- **`<base-editor language="{CHOSEN_LANGUAGE}" code="{INITIAL_TEXT}" theme="{light} or {dark}" type="{normal} or {vertical}" />`**;
- **`<sql-editor code="{INITIAL_TEXT}" theme="{light} or {dark}" type="{normal} or {vertical}" />`**.

The available languages that can be used in the **base-editor** are the following:
|  | Syntax Highlighting | Auto Completion | Lint Checks | Run Code |
| --- | :---: | :---: | :---: | :---: |
| javascript | ✅ | ✅ | ✅ | ✅ |
| typescript | ✅ | ✅ | ✅ | ✅ |
| python | ✅ |  |  | ✅ |
| java | ✅ |  |  | ✅ |
| cpp | ✅ |  |  |  |

The **sql-editor**, instead, provides the following features:
|  | Syntax Highlighting | Auto Completion | Lint Checks | Run Code |
| --- | :---: | :---: | :---: | :---: |
| sql | ✅ | ✅ |  | ✅ |

### Read-only components with predefined editable parts
Sometimes you may want to embed editor components in which only some parts of them are editable. In order to do it, you can use the specially crafted tokens `<EDITABLE>` and `</EDITABLE>`. For example:
```
<base-editor language="python" code="print('<EDITABLE>Hello World!</EDITABLE>')" />
```

## Other exposed functions

Apart from these web components, the following functions are exposed:
- `createEditor(element, language, enableDarkMode, initialText)`: create a CodeMirror editor, returning its instance and a languageConfiguration compartment useful to change language at runtime;
- `setJavascript(editor, languageConfiguration)`: change the editor's language to Javascript using the provided compartment;
- `setTypescript(editor, languageConfiguration)`: change the editor's language to Typescript using the provided compartment;
- `setCpp(editor, languageConfiguration)`: change the editor's language to C++ using the provided compartment;
- `setJava(editor, languageConfiguration)`: change the editor's language to Java using the provided compartment;
- `setPython(editor, languageConfiguration)`: change the editor's language to Python using the provided compartment;
- `setSql(editor, languageConfiguration)`: change the editor's language to SQL using the provided compartment;
- `setTabsHandling(editor, tabsConfiguration, enabled)`: set whether or not tabs should be handled inside the code editor (they are not by default).

## Mentions
- the typescript plugin included in `src/modules/` has been taken from [prisma/text-editors](https://github.com/prisma/text-editors)
- run java code directly in the browser: [teavm-javac](https://github.com/frankbauer/teavm-javac) from [frankbauer](https://github.com/frankbauer)'s fork
- run python code directly in the browser: [pyodide](https://pyodide.org/en/stable/)
- run sql code directly in the browser: [sql.js](https://github.com/sql-js/sql.js/)
