# Interactive Code Playgrounds - Bundle

Interactive Code Playgrounds Bundle is a plugin for embedding interactive code playgrounds in HTML pages.

The editor used in these playgrounds is [CodeMirror6](https://codemirror.net/6/), an in-browser editor distributed as a collection of modules.

The project is based on [Svelte](https://github.com/sveltejs/svelte), a tool for building web applications. The actual build step is performed through [Vite](https://github.com/vitejs/vite) and the [gulp](https://github.com/gulpjs/gulp) tool.

The most computationally expensive tasks the bundle does are performed using [Web Workers and SharedWorkers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers).

## Examples
Some examples of this plugin can be found in the repository [icp-slides](https://github.com/lucademenego99/icp-slides). In particular, a presentation of the main elements this plugin exposes is hosted as a Github Pages website in [https://lucademenego99.github.io/icp-slides/editors.html](https://lucademenego99.github.io/icp-slides/editors.html)

## Building from source

Install all the packages:
```
npm install
```

Run a demo:
```
npm run dev
```

Build the entire module:
```
npm run build-all
```

Build for a specific language;
```
npm run build -- --language typescript
```

**Note**: before building for c++, you need to prepare the webworker:

```
npm run prepare-cpp
```

The build-all command will generate a `dist/base` folder with the following files:
- `*.iife.js`: script to be included inside the HTML page using ICP; to reduce the size of the bundle to be downloaded, please use the file corresponding to the language you want to use;
- `redbean.com`: a redbean web-server ready to be customized to serve ICP slides. [redbean](https://redbean.dev/) is a simple HTTP server that exposes the current folder. It can be executed on Linux, MacOS, Windows, FreeBSD, OpenBSD and NetBSD thanks to the [Cosmopolitan project](https://github.com/jart/cosmopolitan). Please see [icp-create-server](https://github.com/lucademenego99/icp-create-server) for more information on how to use it;
- `example.html`: an example showcasing the main elements exported by the library;
- various css files: styles to make the slides work.


## Exported Web Components

The build phase creates the following web components:
- `<javascript-editor></javascript-editor>`;
- `<typescript-editor></typescript-editor>`;
- `<python-editor></python-editor>`;
- `<cpp-editor></cpp-editor>`;
- `<java-editor></java-editor>`;
- `<cpp-editor></cpp-editor>`;
- `<sql-editor></sql-editor>`;
- `<p5-editor></p5-editor>`;
- `<processing-editor></processing-editor>`;
- `<standardml-editor></standardml-editor>`.

Every component has a set of properties that can be passed inside the tags:
- `code`: the initial code snippet the playground should contain;
- `theme`: *light* or *dark*;
- `type`: *normal* or *vertical*.

To access these components you need to import a bundle in your HTML page. Which bundle to add depends on the language you want to use:
- all the languages: `base/full.iife.js`;
- specific language: `base/{language}.iife.js`.

Since the package is published on npm, you can access it using the CDN you prefer. However, since CDNs like `unpkg.com` are quite slow with not famous scripts, the latest version of the package is also exposed in Github Pages. So you can include it with:
```
<script src="https://lucademenego99.github.io/icp-bundle/base/{language}.iife.js"></script>
```


The available languages that can be used in the editors are the following:
|  | Syntax Highlighting | Auto Completion | Lint Checks | Run Code |
| --- | :---: | :---: | :---: | :---: |
| javascript | ✅ | ✅ |  | ✅ |
| typescript | ✅ | ✅ | ✅ | ✅ |
| python | ✅ | ✅ |  | ✅ |
| java | ✅ |  |  | ✅ |
| c++ | ✅ |  |  | ✅ |
| sql | ✅ | ✅ |  | ✅ |
| p5 | ✅ |  |  | ✅ |
| processing | ✅ |  |  | ✅ |
| standard-ml | ✅ |  |  | ✅ |

### Read-only components with predefined editable parts
Sometimes you may want to embed editor components in which only some parts of them are editable. In order to do it, you can use the specially crafted tokens `<EDITABLE>` and `</EDITABLE>`. For example:
```
<python-editor code="print('<EDITABLE>Hello World!</EDITABLE>')" />
```

## Other exposed functions

Apart from these web components, the following functions are exposed:
- `createEditor(element, language, enableDarkMode, initialText)`: create a CodeMirror editor, returning its instance and a languageConfiguration compartment;
- `setTabsHandling(editor, tabsConfiguration, enabled)`: set whether or not tabs should be handled inside the code editor (they are not by default).

They can be called using one of the exported names from Javascript:
- `InteractiveCodePlaygrounds` (if `full.iife.js` has been imported);
- `JavascriptCodePlaygrounds` (if `javascript.iife.js` has been imported);
- `TypescriptCodePlaygrounds` (if `typescript.iife.js` has been imported);
- `PythonCodePlaygrounds` (if `python.iife.js` has been imported);
- `JavaCodePlaygrounds` (if `java.iife.js` has been imported);
- `CppCodePlaygrounds` (if `cpp.iife.js` has been imported);
- `SqlCodePlaygrounds` (if `sql.iife.js` has been imported)
- `P5CodePlaygrounds` (if `p5-and-processing.iife.js` has been imported)
- `StandardMLCodePlaygrounds` (if `standard-ml.iife.js` has been imported).

## Mentions
- the typescript plugin included in `src/modules/` has been taken from [prisma/text-editors](https://github.com/prisma/text-editors)
- run java code in the browser: [teavm-javac](https://github.com/frankbauer/teavm-javac) based on [frankbauer](https://github.com/frankbauer)'s fork (but modified to work as a SharedWorker)
- run c++ code in the browser: [wasm-clang](https://github.com/binji/wasm-clang) and [playcode](https://github.com/InfiniteXyy/playcode)
- run python code in the browser: [pyodide](https://pyodide.org/en/stable/)
- run sql code in the browser: [sql.js](https://github.com/sql-js/sql.js/)
- run standard ml code in the browser: [SOSML](https://github.com/SOSML/SOSML)
