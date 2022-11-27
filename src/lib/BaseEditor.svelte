<svelte:options tag="base-editor" />

<script lang="ts">
    /**
     * PROPS
     */
    export let language:
        | "javascript"
        | "typescript"
        | "python"
        | "cpp"
        | "java"
        | "sql" = "javascript";
    export let type: "normal" | "vertical" = "normal";
    export let theme: "light" | "dark" = "light";
    export let code = "";
    export let offline = false;
    export let webworker: Worker | SharedWorker;

    /**
     * IMPORTS
     */
    import { onMount } from "svelte";
    import type { EditorView } from "@codemirror/view";
    import type { Compartment } from "@codemirror/state";

    /**
     * Components
     */
    import RunButton from "./components/RunButton.svelte";
    import SettingsButton from "./components/SettingsButton.svelte";
    import OverlayMessage from "./components/OverlayMessage.svelte";
    import EditorContainer from "./components/EditorContainer.svelte";
    import { setDarkMode } from "../utils";

    /**
     * ELEMENTS
     */
    let rootElement: HTMLElement;

    /**
     * GLOBAL VARIABLES
     */
    let codeMirrorEditor: EditorView,
        tabsConfiguration: Compartment,
        editableFilterConfiguration: Compartment,
        darkModeConfiguration: Compartment;
    let output = "",
        outputError = false;
    let messageToShow = "",
        messageShowing = false;

    /**
     * FUNCTIONS
     */

    /**
     * Function used to show a given message to the user
     */
    function showMessage(message: string) {
        messageShowing = true;
        messageToShow = message;
        setTimeout(function () {
            messageShowing = false;
        }, 1000);
    }

    /**
     * Change the current theme, enabling or disabling the dark mode
     * @param darkMode whether the dark mode should be enabled or not
     */
    function setTheme(darkMode: boolean) {
        theme = darkMode ? "dark" : "light";
        setDarkMode(codeMirrorEditor, darkModeConfiguration, darkMode);
    }

    /**
     * Listen to changes on the theme value. If there is a change,
     * update the CSS variables accordingly
    */
    $: {
        if (rootElement) {
            rootElement.style.setProperty(
                "--main-output-bg-color",
                theme == "dark" ? "#333842" : "#f5f5f5"
            );
            rootElement.style.setProperty(
                "--main-output-text-color",
                theme == "dark" ? "#cccccc" : "#303030"
            );
            rootElement.style.setProperty(
                "--output-text-color",
                theme == "dark" ? "#eeeeee" : "#303030"
            );
            rootElement.style.setProperty(
                "--run-button-bg-color",
                theme == "dark" ? "#333842" : "white"
            );
            rootElement.style.setProperty(
                "--run-button-bg-color-hover",
                theme == "dark" ? "#2C313A" : "#eeeeee"
            );
            rootElement.style.setProperty(
                "--run-button-text-color",
                theme == "dark" ? "white" : "black"
            );
            rootElement.style.setProperty(
                "--table-th-color",
                theme == "dark" ? "#dddddd" : "#dddddd"
            );
            rootElement.style.setProperty(
                "--table-tr-even-color",
                theme == "dark" ? "#e8e8e8" : "#404652"
            );
            rootElement.style.setProperty(
                "--table-tr-hover-color",
                theme == "dark" ? "#dddddd" : "#333842"
            );
            rootElement.style.setProperty(
                "--table-th-background-color",
                theme == "dark" ? "#362f4b" : "#362f4b"
            );
            rootElement.style.setProperty(
                "--table-th-text-color",
                theme == "dark" ? "white" : "white"
            );
            rootElement.style.setProperty(
                "--theme-color",
                theme == "dark" ? "#cccccc" : "#ffee00"
            );
        }
    }
</script>

<!-- Editor's HTML -->
<div bind:this={rootElement} id="code-container">
    <overlay-message {type} show={messageShowing} message={messageToShow} />

    <!-- Button allowing the user to toggle the current theme (light / dark) -->
    <button
        on:click={() => {
            setTheme(theme == "light" ? true : false);
        }}
        style="position: absolute; right: {type == 'vertical'
            ? 'calc(var(--output-height) + 10px)'
            : '10px'}; top: 10px; padding: 4px; width: 30px; height: 30px; border: 0px; border-radius: .4em; display: flex; justify-content: center; align-items: center; z-index: 99; background-color: var(--theme-color); cursor: pointer;"
    >
        {#if theme == "dark"}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="white"
                class="w-6 h-6"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
                />
            </svg>
        {:else}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="black"
                class="w-6 h-6"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                />
            </svg>
        {/if}
    </button>

    <!-- Settings Button: copy, reset, allow tabs -->
    <settings-button
        {type}
        editor={codeMirrorEditor}
        tabsconf={tabsConfiguration}
        editableconf={editableFilterConfiguration}
        {code}
        on:showmsg={(event) => {
            showMessage(event.detail);
        }}
    />

    <!-- Run Button: run the provided code and get the output -->
    <run-button
        {type}
        {language}
        editor={codeMirrorEditor}
        {webworker}
        {offline}
        on:changedout={(event) => {
            output = event.detail.output;
            outputError = event.detail.outputError;
        }}
    />

    <!-- Main Editor Container - powered by CodeMirror -->
    <editor-container
        {language}
        {type}
        {theme}
        {code}
        {output}
        iserror={outputError}
        on:editormsg={(event) => {
            codeMirrorEditor = event.detail.editor;
            tabsConfiguration = event.detail.tabsConfiguration;
            editableFilterConfiguration =
                event.detail.editableFilterConfiguration;
            darkModeConfiguration = event.detail.darkModeConfiguration;
        }}
    />
</div>

<style>
    /* CSS global variables */
    :host {
        --error-color: red;
        --run-btn-main-color: #00cc3d;
        --run-btn-active-color: #00aa33;
        --run-btn-shadow-color: #00cc3d81;
        --run-btn-active-shadow-color: #00cc3d3d;
        --output-height: 30%;
    }

    /* Reset styles that may appear from upper elements (e.g. with reveal.js) */
    #code-container > * {
        margin: 0;
        padding: 0;
        vertical-align: baseline;
        line-height: normal;
        font-size: medium;
        text-align: left;
    }

    #code-container {
        font-family: "Roboto", sans-serif;
        font-weight: 300;
        background-color: white;
        color: black;
        position: relative;
        width: 100%;
        height: 100%;
    }
</style>
