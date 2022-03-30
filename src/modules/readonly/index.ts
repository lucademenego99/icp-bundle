import { EditorView, Decoration, DecorationSet, keymap } from "@codemirror/view"
import { EditorState, StateField, StateEffect, Transaction, Extension } from "@codemirror/state"

/**
 * This file exports:
 * - an extension that makes it possible to set up a custom editor in which only some parts of it are editable
 * - a utility function that can be used to set which parts of the text are editable
 */

/**
 * CSS class to mark editable fields
 */
const editableMark = Decoration.mark({ class: "cm-editable" });

/**
 * Theme for the cm-editable custom class, which is used to mark editable fields
 * It automatically switches based on the current type of theme (light/dark)
 */
const editableTheme = EditorView.baseTheme({
    "&light .cm-editable": { backgroundColor: '#cacaca' },
    "&dark .cm-editable": { backgroundColor: '#151a24' },
});

/**
 * Custom effect associated to a transaction, that sets a text as editable
 */
const setEditable = StateEffect.define<{ from: number, to: number }>();

/**
 * Set up a custom set of decorations for editable texts
 */
const editableField = StateField.define<DecorationSet>({
    create() {
        return Decoration.none;
    },
    update(editableDecorations, transaction) {
        editableDecorations = editableDecorations.map(transaction.changes);
        for (let e of transaction.effects) {
            if (e.is(setEditable)) {
                editableDecorations = editableDecorations.update({
                    add: [editableMark.range(e.value.from - 1, e.value.to + 1)]
                });
            }
        }
        return editableDecorations;
    },
    provide: f => EditorView.decorations.from(f)
});

/**
 * Allow to edit only specific parts of the text
 * @returns A custom extension for the editor
 */
export function readOnlyTransactionFilter(): Extension {
    return EditorState.transactionFilter.of((transaction) => {
        let editableRangeSet: DecorationSet | undefined = transaction.startState.field(editableField, false);
        if (editableRangeSet && transaction.docChanged && !transaction.annotation(Transaction.remote)) {
            let allowEdit: boolean = false;   // Should we allow edit or not?
            transaction.changes.iterChangedRanges((chFrom, chTo) => {
                editableRangeSet!.between(chFrom, chTo, (roFrom, roTo) => {
                    if (chFrom > roFrom && chTo < roTo) allowEdit = true;
                })
            })
            if (!allowEdit) return [];
        }
        return transaction;
    });
}

/**
 * Set a specific part of the text to editable
 * @param view The editor's view
 * @param from Start of the editable range
 * @param to End of the editable range
 * @param enableDarkMode Whether to enable dark mode or not
 * @returns A boolean indicating whether the effect has been applied or not
 */
export function editableSelection(view: EditorView, from: number, to: number, enableDarkMode: boolean = false): boolean {
    let effects: StateEffect<unknown>[] = [setEditable.of({ from, to })];
    if (!effects.length) return false;

    if (!view.state.field(editableField, false))
        effects.push(StateEffect.appendConfig.of([editableField, (enableDarkMode ? editableTheme : editableTheme)]));
    view.dispatch({ effects });
    return true;
}
