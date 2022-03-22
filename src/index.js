import { Compartment } from "@codemirror/state"
import { EditorState, EditorView, basicSetup } from "@codemirror/basic-setup"
import { lintGutter, linter } from "@codemirror/lint"
import { javascript, esLint } from "@codemirror/lang-javascript"
import { java } from "@codemirror/lang-java"
import { cpp } from "@codemirror/lang-cpp"
import { oneDark } from "@codemirror/theme-one-dark";
import Linter from "eslint4b-prebuilt";
import { typescript } from "./modules/typescript/index.ts";
import createComponents from "./components/ceComponents";

/**
 * Extensions mapped to each supported language
 */
const languageSelection = {
    "javascript": [javascript(), linter(esLint(new Linter())), lintGutter()],
    "typescript": typescript(),
    "cpp": cpp(),
    "java": java()
}

/**
 * Create a CodeMirror editor
 * @param querySelection DOM elements in which we want to create the editor
 * @param language Selected language for the editor
 * @param enableDarkMode Choose whether to enable the dark mode or not
 * @param initialText Text that should be present in the editor at startup
 * @returns The codemirror editor instance and a languageConfiguration compartment
 */
function createEditor(element, language, enableDarkMode = false, initialText = '') {
    // Create a compartment to handle language configuration
    let languageConfiguration = new Compartment;

    // Define the extensions of the editor
    let extensions = [
        basicSetup,
        languageConfiguration.of(languageSelection[language])
    ];

    // Check if the editor should be in dark mode
    if (enableDarkMode)
        extensions.push(oneDark);

    // Create the editor
    let editor = new EditorView({
        state: EditorState.create({
            doc: initialText,
            extensions: extensions
        }),
        parent: element
    });

    // Return the editor and the languages handler
    return {
        editor, languageConfiguration
    }
}

/* Functions used to change language at runtime */

/**
 * Use C++
 */
function setCpp(editor, languageConfiguration) {
    editor.dispatch({
        effects: languageConfiguration.reconfigure(languageSelection['cpp'])
    });
}

/**
 * Use Java
 */
function setJava(editor, languageConfiguration) {
    editor.dispatch({
        effects: languageConfiguration.reconfigure(languageSelection['java'])
    });
}

/**
 * Use Javascript
 */
function setJavascript(editor, languageConfiguration) {
    editor.dispatch({
        effects: languageConfiguration.reconfigure(languageSelection['javascript'])
    });
}

/**
 * Use Typescript
 */
function setTypescript(editor, languageConfiguration) {
    editor.dispatch({
        effects: languageConfiguration.reconfigure(languageSelection['typescript'])
    });
}

// Create the code editor HTML components
createComponents();

/**
 * Export the editor and util functions to the browser
 */
export {
    createEditor,
    setCpp,
    setJava,
    setJavascript,
    setTypescript,
}
