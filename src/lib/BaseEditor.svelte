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
        | "sql"
        | "p5"
        | "processing" = "javascript";
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
    import ThemeSwitch from "./components/ThemeSwitch.svelte";

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
    let isFullscreen = false;
    let canvas;

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
                "--output-height",
                language == "p5" || language == "processing" ? "50%" : "30%"
            );
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
                theme == "dark" ? "#404652" : "#e8e8e8"
            );
            rootElement.style.setProperty(
                "--table-tr-hover-color",
                theme == "dark" ? "#252930" : "#cccccc"
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

    document.addEventListener('fullscreenchange', (event) => {
        isFullscreen = document.fullscreenElement != null;
    });
</script>

<!-- Editor's HTML -->
<div bind:this={rootElement} id="code-container">
    <overlay-message {type} show={messageShowing} message={messageToShow} />

    <!-- Button allowing the user to toggle the current theme (light / dark) -->
    <theme-switch {theme} {type} on:changedtheme={(event) => {
        setTheme(event.detail.darkMode);
    }} />

    <!-- Button allowing the user to toggle fullscreen -->
    <button on:click={() => {
        if (isFullscreen) {
            document.exitFullscreen();
        } else {
            rootElement.requestFullscreen();
        }
    }} style="position: absolute; right: {type == 'vertical'
            ? 'calc(var(--output-height) + 10px)'
            : '10px'}; top: 10px; width: 30px; height: 30px; border: 0px; border-radius: .4em; display: flex; justify-content: center; align-items: center; z-index: 99; background-color: transparent; cursor: pointer;">
            {#if isFullscreen}
            <svg width="46" height="46" fill="{theme == "dark" ? "white" : "black"}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" d="M5 8h3V5h2v5H5V8Zm3 8H5v-2h5v5H8v-3Zm6 3h2v-3h3v-2h-5v5Zm2-14v3h3v2h-5V5h2Z" clip-rule="evenodd"></path>
            </svg>
            {:else}
            <svg width="46" height="46" fill="{theme == "dark" ? "white" : "black"}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" d="M7 10H5V5h5v2H7v3Zm-2 4h2v3h3v2H5v-5Zm12 3h-3v2h5v-5h-2v3ZM14 7V5h5v5h-2V7h-3Z" clip-rule="evenodd"></path>
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
        on:canvasout={(event) => {
            canvas = event.detail.canvas;
        }}
    />

    <!-- Main Editor Container - powered by CodeMirror -->
    <editor-container
        {language}
        {type}
        {theme}
        {code}
        {output}
        {canvas}
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
