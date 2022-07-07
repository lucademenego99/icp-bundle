import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import { sql } from "@codemirror/lang-sql";
import { python } from "@codemirror/lang-python";
import { lintGutter } from "@codemirror/lint";
import { EditorView, keymap } from "@codemirror/view";
import { typescript } from "./modules/typescript";
import { indentWithTab } from "@codemirror/commands";
import { Compartment, EditorState } from "@codemirror/state";
import { basicSetup } from "@codemirror/basic-setup";
import { oneDark } from "@codemirror/theme-one-dark";
import { editableSelection, notEditableSelection, readOnlyTransactionFilter } from "./modules/readonly";

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

    // Create a compartment to handle tabs handling
    let tabsConfiguration = new Compartment;

    // Define the extensions of the editor
    let extensions = [
        basicSetup,
        EditorView.lineWrapping,
        languageConfiguration.of(languageSelection[language]),
        tabsConfiguration.of([]),
    ];

    // Check if the editor should be in dark mode
    if (enableDarkMode)
        extensions.push(oneDark);

        let editableParts = [];
        let notEditableParts = [];
    // Check if we should enable the mode in which we only allow to edit specific parts of the text
    if (initialText.includes('<EDITABLE>')) {
        extensions.push(readOnlyTransactionFilter());

        // Save all the editable parts of the text inside initialText in an array, where their start is marked with <EDITABLE> and their end is marked with </EDITABLE>
        let count = 0;  // Count how many times we got a correspondence, to calculate the correct indices of the editable parts
        let regex = /(?<=<EDITABLE>)(.|\n)*?(?=<\/EDITABLE>)/gm, result;
        let notEditableFrom = 0;    // Variable to keep track of the start of the not editable part
        while ((result = regex.exec(initialText)) !== null) {
            count++;
            // 10: length of <EDITABLE>
            // 11: length of </EDITABLE>
            editableParts.push({
                from: result.index - (10 * count) - (11 * (count - 1)),
                to: result.index + result[0].length - (10 * count) - (11 * (count - 1))
            });

            // Get the ending part of the not editable part using the same calculations used before
            const notEditableTo = result.index - (10 * count) - (11 * (count - 1));
            // Keep track of the not editable part
            notEditableParts.push({
                from: notEditableFrom,
                to: notEditableTo
            });
            // Update the from variable to keep track of the start of the not editable part
            notEditableFrom = result.index + result[0].length - (10 * count) - (11 * (count - 1));
        }
        // Remove the tokens <EDITABLE> and </EDITABLE> from the initialText
        initialText = initialText.replace(/<EDITABLE>/gm, '').replace(/<\/EDITABLE>/gm, '');
    }

    // Create the editor
    let editor = new EditorView({
        state: EditorState.create({
            doc: initialText,
            extensions: extensions
        }),
        parent: element
    });

    // If the editable mode is enabled, we need to set the not editable text's style
    if (notEditableParts.length > 0) {
        notEditableParts.forEach(part => {
            notEditableSelection(editor, part.from, part.to);
        });
    }
    // If the editable mode is enabled, we need to set the editable text selected by the user
    if (editableParts.length > 0) {
        editableParts.forEach(part => {
            editableSelection(editor, part.from, part.to);
        });

        // Add the final not editable part of the text: from the last editable part to the end of the text
        notEditableSelection(editor, editableParts[editableParts.length-1].to, initialText.length);
    }

    // Return the editor and the languages handler
    return {
        editor, languageConfiguration, tabsConfiguration
    }
}

/**
 * Plugins for CodeMirror, divided by language
 */
const languageSelection = {
    javascript: [javascript(), lintGutter()],
    typescript: typescript(),
    cpp: cpp(),
    java: java(),
    python: python(),
    sql: sql({ upperCaseKeywords: true }),
};

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
 * Use SQL
 */
function setSql(editor, languageConfiguration) {
    editor.dispatch({
        effects: languageConfiguration.reconfigure(languageSelection['sql'])
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

/**
 * Handle tabs
 */
function setTabsHandling(editor, tabsConfiguration, enabled) {
    editor.dispatch({
        effects: tabsConfiguration.reconfigure(enabled ? keymap.of([indentWithTab]) : [])
    });
}

export {
    createEditor,
    languageSelection,
    setCpp,
    setJava,
    setJavascript,
    setTypescript,
    setSql,
    setTabsHandling
}