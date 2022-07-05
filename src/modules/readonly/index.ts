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
 * CSS classes to mark the part before and after editable fields
 */
const editableLimitsMarkBefore = Decoration.mark({ class: "cm-editable-before" });
const editableLimitsMarkAfter = Decoration.mark({ class: "cm-editable-after" });

/**
 * Theme for the editable custom classes, used to mark editable fields
 * The colors automatically switch based on the current type of theme (light/dark)
 */
const editableTheme = EditorView.baseTheme({
    "&light .cm-editable": { borderTop: '1px solid black', borderBottom: '1px solid black' },
    "&dark .cm-editable": { borderTop: '1px solid white', borderBottom: '1px solid white' },
    "&light .cm-editable-before": { backgroundColor: 'rgb(243, 249, 255) !important', borderRight: '2px solid black' },
    "&light .cm-editable-after": { backgroundColor: 'rgb(243, 249, 255) !important', borderLeft: '2px solid black' },
    "&dark .cm-editable-before": { backgroundColor: 'rgb(44, 49, 58) !important', borderRight: '2px solid white' },
    "&dark .cm-editable-after": { backgroundColor: 'rgb(44, 49, 58) !important', borderLeft: '2px solid white' },
});

/**
 * Custom effect associated to a transaction, that sets a text as editable
 */
const setEditable = StateEffect.define<{ from: number, to: number }>();

/**
 * Custom effects associated to a transaction, that put a limit to the editable part of the text
 */
const setEditableBefore = StateEffect.define<{ from: number, to: number }>();
const setEditableAfter = StateEffect.define<{ from: number, to: number }>();

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
 * Set up a custom set of decorations for the part before and after the editable text
 */
const editableFieldBeforeAfter = StateField.define<DecorationSet>({
    create() {
        return Decoration.none;
    },
    update(editableDecorations, transaction) {
        editableDecorations = editableDecorations.map(transaction.changes);
        for (let e of transaction.effects) {
            if (e.is(setEditableBefore)) {
                editableDecorations = editableDecorations.update({
                    add: [editableLimitsMarkBefore.range(e.value.from, e.value.to)]
                })
            } else if (e.is(setEditableAfter)) {
                editableDecorations = editableDecorations.update({
                    add: [editableLimitsMarkAfter.range(e.value.from, e.value.to)]
                })
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
export function editableSelection(view: EditorView, from: number, to: number): boolean {
    // Set the decoration for the editable text
    let effectsEditable: StateEffect<unknown>[] = [setEditable.of({ from, to })];
    if (!effectsEditable.length) return false;

    if (!view.state.field(editableField, false))
        effectsEditable.push(StateEffect.appendConfig.of([editableField, editableTheme]));

    // Set the decoration for the part before and after the editable text
    let effectsBeforeAfter: StateEffect<unknown>[] = [setEditableBefore.of({ from: from - 1, to: from }), setEditableAfter.of({ from: to, to: to + 1 })];
    if (!view.state.field(editableFieldBeforeAfter, false))
        effectsBeforeAfter.push(StateEffect.appendConfig.of([editableFieldBeforeAfter, editableTheme]));

    // Dispatch the effects
    view.dispatch({ effects: effectsBeforeAfter });
    view.dispatch({ effects: effectsEditable });
    return true;
}
