import { EditorView, Decoration, DecorationSet, keymap } from "@codemirror/view"
import { EditorState, StateField, StateEffect, Transaction, Extension } from "@codemirror/state"

/**
 * This file exports:
 * - an extension that makes it possible to set up a custom editor in which only some parts of it are editable
 * - a utility function that can be used to set which parts of the text are editable
 */

/**
 * CSS class to mark editable fields
 * IMPORTANT: use inclusive ranges
 */
const editableMark = Decoration.mark({ class: "cm-editable", inclusive: true });

/**
 * CSS class to mark not editable fields
 */
const notEditableMark = Decoration.mark({ class: "cm-not-editable" });

/**
 * CSS classes to mark the part before and after editable fields
 */
const editableLimitsMarkBefore = Decoration.mark({ class: "cm-editable-before" });
const editableLimitsMarkAfter = Decoration.mark({ class: "cm-editable-after" });

/**
 * Theme for the editable and not editable custom classes, used to mark fields
 * The colors automatically switch based on the current type of theme (light/dark)
 */
const editableTheme = EditorView.baseTheme({
    "&light .cm-editable": { borderTop: '1px solid blue', borderBottom: '1px solid blue' },
    "&dark .cm-editable": { borderTop: '1px solid yellow', borderBottom: '1px solid yellow', backgroundColor: 'rgb(25, 28, 33, 0.3)' },
    "&light .cm-editable-before": { borderRight: '2px solid blue' },
    "&light .cm-editable-after": { borderLeft: '2px solid blue' },
    "&dark .cm-editable-before": { borderRight: '2px solid yellow' },
    "&dark .cm-editable-after": { borderLeft: '2px solid yellow' },
    "&light .cm-not-editable": { backgroundColor: 'rgb(50, 50, 50, 0.07)', cursor: 'not-allowed' },
    "&dark .cm-not-editable": { backgroundColor: 'rgb(200, 200, 200, 0.07)', cursor: 'not-allowed' },
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
 * Custom effects associated to a transaction, that sets a text as not editable
 */
const setNotEditable = StateEffect.define<{ from: number, to: number }>();

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
                    add: [editableMark.range(e.value.from , e.value.to )]
                });
            }
        }
        return editableDecorations;
    },
    provide: f => EditorView.decorations.from(f)
});

/**
 * Set up a custom set of decorations for not editable texts
 */
const notEditableField = StateField.define<DecorationSet>({
    create() {
        return Decoration.none;
    },
    update(notEditableDecorations, transaction) {
        notEditableDecorations = notEditableDecorations.map(transaction.changes);
        for (let e of transaction.effects) {
            if (e.is(setNotEditable)) {
                notEditableDecorations = notEditableDecorations.update({
                    add: [notEditableMark.range(e.value.from, e.value.to)]
                });
            }
        }
        return notEditableDecorations;
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
                    if (chFrom >= roFrom && chTo <= roTo) allowEdit = true;
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

/**
 * Set a specific part of the text to not editable
 * @param view The editor's view
 * @param from Start of the not editable range
 * @param to End of the not editable range
 * @returns A boolean indicating whether the effects has been applied or not
 */
export function notEditableSelection(view: EditorView, from: number, to: number): boolean {
    // Set the decoration for the not editable text
    let effectsNotEditable: StateEffect<unknown>[] = [setNotEditable.of({ from, to })];
    if (!effectsNotEditable.length) return false;

    if (!view.state.field(notEditableField, false))
        effectsNotEditable.push(StateEffect.appendConfig.of([notEditableField, editableTheme]));

    // Dispatch the effects
    view.dispatch({ effects: effectsNotEditable });
    return true;
}
