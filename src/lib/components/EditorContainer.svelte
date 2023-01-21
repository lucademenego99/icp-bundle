<svelte:options tag="editor-container" />

<script lang="ts">
    /**
     * IMPORTS
     */
    import { onMount } from "svelte";
    import Split from "split.js";
    import { createEditor } from "../../utils";
    import type { EditorView } from "@codemirror/view";
    import type { Compartment } from "@codemirror/state";
    import { executeRequest, editorToExecute } from "../../stores";

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
    export let code: string;
    export let output: string;
    export let canvas: HTMLCanvasElement;
    export let iserror: boolean;

    /**
     * ELEMENTS
     */
    let ref: HTMLElement;
    let editorElement: HTMLElement,
        outputContainer: HTMLElement,
        outputElement: HTMLElement;

    /**
     * VARIABLES
     */
    let codeMirrorEditor: EditorView,
        tabsConfiguration: Compartment,
        editableFilterConfiguration: Compartment,
        darkModeConfiguration: Compartment;

    $: {
        const event = new CustomEvent("editormsg", {
            detail: {
                editor: codeMirrorEditor,
                tabsConfiguration,
                editableFilterConfiguration,
                darkModeConfiguration,
            },
            bubbles: true,
            cancelable: true,
            composed: true,
        });
        ref?.dispatchEvent(event);
    }

    $: {
        if (canvas) {
            outputContainer.innerHTML = "";
            outputContainer.appendChild(canvas);
        } else if (
            outputContainer &&
            outputContainer.getElementsByTagName("canvas").length > 0
        ) {
            outputContainer.innerHTML = "";
        }
    }

    $: {
        if (language == "sql" && outputElement) {
            outputElement.innerHTML = output;
        }
    }

    /**
     * FUNCTIONS
     */

    onMount(() => {
        editorElement.addEventListener("execute", () => {
            $editorToExecute = editorElement.firstChild as HTMLElement;
            $executeRequest = true;
        });
        // Make editor and output splitted and resizable using split.js
        Split([editorElement, outputContainer], {
            minSize: 40,
            gutterSize: 5,
            sizes:
                language == "p5" || language == "processing"
                    ? [50, 50]
                    : [70, 30],
            direction: type == "normal" ? "vertical" : "horizontal",
        });

        // Create the CodeMirror editor
        let res;
        if (!codeMirrorEditor) {
            res = createEditor(editorElement, language, theme == "dark", code);
        }

        // Get access to the editor instance
        codeMirrorEditor = res.editor;
        tabsConfiguration = res.tabsConfiguration;
        editableFilterConfiguration = res.editableFilterConfiguration;
        darkModeConfiguration = res.darkModeConfiguration;
    });
</script>

<div
    bind:this={ref}
    id="editor-container"
    style={type == "vertical"
        ? "display: flex; flex-direction: row; justify-content: space-between;"
        : "display: flex; flex-direction: column;"}
>
    <!-- Workaround to make vite load custom styles - otherwise they are deleted automatically -->
    {#if false}
        <div
            class="gutter gutter-vertical gutter-horizontal cm-editor cm-scroller"
        />
        <div><table><tr><th /><td /></tr></table></div>
    {/if}

    <!-- CodeMirror Editor -->
    <div
        bind:this={editorElement}
        style={type == "vertical"
            ? "height: 100%; width: calc(100% - var(--output-height));"
            : ""}
        id="editor"
    />
    <!-- Output -->
    <div
        bind:this={outputContainer}
        id="editor-output"
        style={type == "vertical"
            ? "height: 100%; width: var(--output-height); min-height: 0; min-width: 100px;"
            : ""}
    >
        <div
            id="output-title-container"
            style={type == "vertical" ? "height: 3vmin; margin-top: 1vh;" : ""}
        >
            <p id="output-title">OUTPUT</p>
        </div>
        <!-- Output console.log -->
        <div
            id="output-container"
            style={type == "vertical"
                ? "height: calc(100% - 3vmin - 1vh);"
                : "width: 100%;"}
            class="rounded-scrollbar"
        >
            {#if language == "sql"}
                <div
                    bind:this={outputElement}
                    style={iserror ? "color: var(--error-color);" : ""}
                    class="output-text"
                    id="output"
                />
            {:else}
                <p
                    style={iserror ? "color: var(--error-color);" : ""}
                    class="output-text"
                    id="output"
                >
                    {output}
                </p>
            {/if}
        </div>
    </div>
</div>

<style>
    #editor-container {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 100%;
        box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
    }

    #editor {
        height: calc(100% - var(--output-height));
    }

    #editor-output {
        z-index: 99;
        box-sizing: border-box;
        background-color: var(--main-output-bg-color);
        color: var(--main-output-text-color);
        height: var(--output-height);
        overflow: hidden;
    }

    #output-title-container {
        height: 3vmin;
        display: flex;
        align-items: center;
    }

    #output-title {
        margin: 0;
        height: 60%;
        margin-left: 0.8vw;
        font-size: 1.6vmin;
        width: fit-content;
        border-bottom: 1px solid var(--output-text-color);
        color: var(--output-text-color);
        box-sizing: border-box;
    }

    #output-container {
        overflow: auto;
        height: calc(100% - 3vmin);
        width: 100%;
    }

    .output-text {
        color: var(--output-text-color);
        padding: 0.1vh 0 0 0.6vw;
        margin: 0;
        font-family: monospace;
        font-size: 2vmin;
        white-space: pre-wrap;
    }

    /* Code Mirror editor customization */
    .cm-editor {
        height: 100%;
        font-size: 2vmin;
    }

    .cm-scroller {
        overflow: auto;
    }

    /* Split.js gutter customization */
    .gutter {
        z-index: 99;
        background-color: rgb(150, 150, 150);
        background-repeat: no-repeat;
        background-position: 50%;
        transition: background-color 1s;
    }
    .gutter:hover {
        background-color: #466be5;
    }

    .gutter.gutter-vertical {
        background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAFAQMAAABo7865AAAABlBMVEVHcEzMzMzyAv2sAAAAAXRSTlMAQObYZgAAABBJREFUeF5jOAMEEAIEEFwAn3kMwcB6I2AAAAAASUVORK5CYII=");
        cursor: row-resize;
    }

    .gutter.gutter-horizontal {
        background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAeCAYAAADkftS9AAAAIklEQVQoU2M4c+bMfxAGAgYYmwGrIIiDjrELjpo5aiZeMwF+yNnOs5KSvgAAAABJRU5ErkJggg==");
        cursor: col-resize;
    }

    /* SQL output styling */
    table {
        margin: 1vmin;
        border-collapse: collapse;
    }
    td,
    th {
        border: 1px solid var(--table-th-color);
        text-align: center;
        padding: 8px;
    }
    tr:nth-child(even) {
        background-color: var(--table-tr-even-color);
    }
    tr:hover {
        background-color: var(--table-tr-hover-color);
    }
    th {
        padding-top: 12px;
        padding-bottom: 12px;
        text-align: center;
        background-color: var(--table-th-background-color);
        color: var(--table-th-text-color);
    }

    /* Custom rounded scrollbar for the editor */
    *::-webkit-scrollbar-track {
        box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
        -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
        background-color: var(--dark-mode-main-output-bg-color-light);
    }

    *::-webkit-scrollbar {
        width: 6px;
        background-color: var(--main-output-bg-color);
    }

    *::-webkit-scrollbar-thumb {
        box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
        -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
        background-color: #999999;
    }

    .rounded-scrollbar::-webkit-scrollbar-track {
        border-radius: 10px;
        background-color: var(--main-output-bg-color);
    }

    .rounded-scrollbar::-webkit-scrollbar-thumb {
        border-radius: 10px;
    }
</style>
