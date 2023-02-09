import { writable, Writable } from "svelte/store";

/**
 * Whether the theme should be set to dark or not
 * @type {Writable<boolean>}
 */
 export const executeRequest: Writable<boolean> = writable(false);

 /**
  * The editor instance that asked to execute the code
  * @type {Writable<HTMLElement>}
  */
 export const editorToExecute: Writable<HTMLElement> = writable(null);

/**
 * Default theme, connected to localStorage
 * It is needed to listen to update the theme at runtime when it is changed from another ICP editor
 * @type {Writable<string>}
 */
export const icpDefaultTheme: Writable<string> = writable(localStorage.getItem("icpDefaultTheme") || null);