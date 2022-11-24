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

    /**
     * ELEMENTS
     */
    let rootElement: HTMLElement;

    /**
     * GLOBAL VARIABLES
     */
    let codeMirrorEditor: EditorView, tabsConfiguration: Compartment, editableFilterConfiguration: Compartment;
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
     * On mount, set theme CSS properties
     */
    onMount(() => {
        rootElement.style.setProperty(
            "--main-output-bg-color",
            theme == "dark" ? "#f5f5f5" : "#282c34"
        );
        rootElement.style.setProperty(
            "--main-output-text-color",
            theme == "dark" ? "#cccccc" : "#fffeff"
        );
        rootElement.style.setProperty(
            "--output-text-color",
            theme == "dark" ? "#000000" : "#fffeff"
        );
        rootElement.style.setProperty(
            "--run-button-bg-color",
            theme == "dark" ? "#282C34" : "white"
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
    });
</script>

<!-- Editor's HTML -->
<div bind:this={rootElement} id="code-container">
    <overlay-message {type} show={messageShowing} message={messageToShow} />

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
            editableFilterConfiguration = event.detail.editableFilterConfiguration;
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
