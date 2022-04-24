# Interactive Code Playgrounds Bundle

Interactive Code Playgrounds Bundle is a Javascript plugin for embedding interactive code playgrounds in html pages.

The editor used in these playgrounds is [CodeMirror](https://codemirror.net/6/), an in-browser editor distributed as a collection of modules that aren't directly loadable by the browser.

The project is based on [Svelte](https://github.com/sveltejs/svelte), a compiler converting the exposed components in efficient JavaScript. The build, instead, is performed through [Vite](https://github.com/vitejs/vite).

## Examples
Some examples of this plugin can be found in the repository [icp-slides](https://github.com/lucademenego99/icp-slides). In particular, a presentation of the main elements this plugin exposes is hosted as a Github Pages website in [https://lucademenego99.github.io/icp-slides/editors.html](https://lucademenego99.github.io/icp-slides/editors.html)

## Installation

The main script that Vite uses is `src/main.ts`. First of all, install all the packages:
```
npm install
```

Then you can build the module with:
```
npm run build
```

or run a demo with:
```
npm run dev
```

The build command will generate the files `dist/icp-bundle.es.js` and `dist/icp-bundle.umd.js`. To use the exposed web components and functions in an HTML page you can simply import the script:
```<script src='icp-bundle.umd.js></script>'```

## Web Components

This file exports the following web components:
- **`<default-editor language="{CHOSEN_LANGUAGE}" code="{INITIAL_TEXT}" theme="{light} or {dark}" />`**;
- ...

The available languages that can be used are the following:
|  | Syntax Highlighting | Auto Completion | Lint Checks | Run Code |
| --- | :---: | :---: | :---: | :---: |
| javascript | ✅ | ✅ | ✅ | ✅ |
| typescript | ✅ | ✅ | ✅ | ✅ |
| python | ✅ |  |  | ✅ |
| java | ✅ |  |  |  |
| cpp | ✅ |  |  |  |

### Read-only components with predefined editable parts
Sometimes you may want to embed editor components in which only some parts of them are editable. In order to do it, you can use the specially crafted tokens `<EDITABLE>` and `</EDITABLE>`. For example:
```
<default-editor code="#include <iostream>
using namespace std;
int main() {
    cout << '<EDITABLE>Hello World!</EDITABLE>' << endl;
    return 0;
}" />
```

## Other exposed functions

Apart from these web components, the following functions are exposed:
- `createEditor(element, language, enableDarkMode, initialText)`: create a CodeMirror editor, returning its instance and a languageConfiguration compartment useful to change language at runtime;
- `setJavascript(editor, languageConfiguration)`: change the editor's language to Javascript using the provided compartment;
- `setTypescript(editor, languageConfiguration)`: change the editor's language to Typescript using the provided compartment;
- `setCpp(editor, languageConfiguration)`: change the editor's language to C++ using the provided compartment;
- `setJava(editor, languageConfiguration)`: change the editor's language to Java using the provided compartment;
- `setPython(editor, languageConfiguration)`: change the editor's language to Python using the provided compartment;
- `setTabsHandling(editor, tabsConfiguration, enabled)`: set whether or not tabs should be handled inside the code editor (they are not by default).

## Mentions

The typescript plugin included in `src/modules/` has been taken from [prisma/text-editors](https://github.com/prisma/text-editors).

In order to run python code directly in the browser [Pyodide](https://pyodide.org/en/stable/) has been used.
