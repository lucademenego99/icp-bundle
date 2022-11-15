import { writable, Writable } from "svelte/store";

/**
 * Whether the theme should be set to dark or not
 */
 export const executeRequest: Writable<boolean> = writable(false);

 /**
  * The editor instance that asked to execute the code
  */
 export const editorToExecute: Writable<HTMLElement> = writable(null);