import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import { sql } from "@codemirror/lang-sql";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { lintGutter } from "@codemirror/lint";
import {StreamLanguage} from "@codemirror/language"
import {sml} from "@codemirror/legacy-modes/mode/mllike"
import { EditorView, keymap } from "@codemirror/view";
import { typescript } from "./modules/typescript";
import { indentWithTab } from "@codemirror/commands";
import { Compartment, EditorState, Prec } from "@codemirror/state";
import { basicSetup } from "codemirror";
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
    console.log('Creating editor for element', element);
    // Create a compartment to handle language configuration
    let languageConfiguration = new Compartment;

    // Create a compartment to handle tabs handling
    let tabsConfiguration = new Compartment;

    let editableFilterConfiguration = new Compartment;

    let darkModeConfiguration = new Compartment;

    // Define the extensions of the editor
    let extensions = [
        basicSetup,
        EditorView.lineWrapping,
        languageConfiguration.of(languageSelection[language]),
        tabsConfiguration.of([]),
        darkModeConfiguration.of(enableDarkMode ? oneDark : []),
        // Fire event execute when clicking CTRL+ENTER
        Prec.highest(
            keymap.of([{
            key: "Ctrl-Enter",
            run: () => {
                // Fire a Custom Event 'execute'
                element.dispatchEvent(new CustomEvent('execute'));
                return true;
            }
            }])
        ),
        // Fire a Custom Event 'changedcode' whenever the code changes
        EditorView.updateListener.of((v) => {
            if (v.docChanged) {
                element.dispatchEvent(new CustomEvent('changedcode', {
                    detail: {
                        content: v.state.doc.toString()
                    },
                    bubbles: true,
                    cancelable: true,
                    composed: true,
                }));
            }
        })
    ];

    let editableParts = [];
    let notEditableParts = [];
    // Check if we should enable the mode in which we only allow to edit specific parts of the text
    if (initialText.includes('<EDITABLE>')) {
        extensions.push(editableFilterConfiguration.of([readOnlyTransactionFilter()]));

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
        notEditableSelection(editor, editableParts[editableParts.length - 1].to, initialText.length);
    }

    // Return the editor and the languages handler
    return {
        editor, languageConfiguration, tabsConfiguration, editableFilterConfiguration, darkModeConfiguration
    }
}

/**
 * Plugins for CodeMirror, divided by language
 */
const languageSelection = {
    javascript: [javascript(), lintGutter()],
    typescript: typescript(),
    java: java(),
    python: python(),
    cpp: cpp(),
    sql: sql({ upperCaseKeywords: true }),
    p5: javascript(),
    processing: java(),
    ml: StreamLanguage.define(sml),
};

/**
 * Tabs handling configuration
 * @param editor The editor instance
 * @param tabsConfiguration The tabs configuration compartment
 * @param enabled Whether to enable or disable the tabs handling
 */
function setTabsHandling(editor, tabsConfiguration, enabled) {
    editor.dispatch({
        effects: tabsConfiguration.reconfigure(enabled ? keymap.of([indentWithTab]) : [])
    });
}

/**
 * Set the theme
 * @param editor The editor instance
 * @param darkModeConfiguration The compartment that handles the dark mode
 * @param enabled Whether to enable the dark mode or not
 */
function setDarkMode(editor, darkModeConfiguration, enabled) {
    editor.dispatch({
        effects: darkModeConfiguration.reconfigure(enabled ? oneDark : [])
    });
}

/**
 * Update the editable filter - this function is called when the user decides to unlock or lock again the non-editable parts of the code
 * @param editor The editor instance
 * @param editableFilterConfiguration The compartment that handles the editable filter
 * @param code The code that should be present in the editor
 * @param enabled whether to enable or disable the editable filter
 */
function setEditableFilter(editor, editableFilterConfiguration, code, enabled) {
    editor.dispatch({
        effects: editableFilterConfiguration.reconfigure(enabled ? readOnlyTransactionFilter() : [])
    });
    if (enabled) {
        let editableParts = [];
        let notEditableParts = [];
        // Save all the editable parts of the text inside code in an array, where their start is marked with <EDITABLE> and their end is marked with </EDITABLE>
        let count = 0;  // Count how many times we got a correspondence, to calculate the correct indices of the editable parts
        let regex = /(?<=<EDITABLE>)(.|\n)*?(?=<\/EDITABLE>)/gm, result;
        let notEditableFrom = 0;    // Variable to keep track of the start of the not editable part
        while ((result = regex.exec(code)) !== null) {
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
        // Remove the tokens <EDITABLE> and </EDITABLE> from the code
        code = code.replace(/<EDITABLE>/gm, '').replace(/<\/EDITABLE>/gm, '');

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
            notEditableSelection(editor, editableParts[editableParts.length - 1].to, code.length);
        }
        editor.dispatch({
            changes: [
                {
                    from: 0,
                    to: editor.state.doc.length,
                    insert: code,
                },
            ],
        });
    } else {
        editor.dispatch({
            changes: [
                {
                    from: 0,
                    to: editor.state.doc.length,
                    insert: code.replace(/<EDITABLE>/gm, '').replace(/<\/EDITABLE>/gm, ''),
                },
            ],
        });
    }
    
}

export {
    createEditor,
    languageSelection,
    setTabsHandling,
    setEditableFilter,
    setDarkMode
}