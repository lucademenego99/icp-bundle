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
        outputElement: HTMLElement,
        canvasContainer: HTMLElement,
        consoleOutput: HTMLElement;

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
            canvasContainer.innerHTML = "";
            canvasContainer.appendChild(canvas);
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
            gutterSize: 1,
            minSize: 0,
            sizes:
                language == "p5" || language == "processing"
                    ? [50, 50]
                    : [70, 30],
            direction: type == "normal" ? "vertical" : "horizontal",
        });

        // Make canvas and console splitted and resizable using split.js
        if (language == "p5" || language == "processing") {
            Split([canvasContainer, consoleOutput], {
                gutterSize: 1,
                minSize: 0,
                sizes: [70, 30],
                direction: "vertical",
            });
        }

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
        <div class="cm-tooltip-autocomplete cm-tooltip cm-tooltip-below" />
        <div class="ͼ1">
            <div class="cm-line" />
            <div class="cm-content" />
            <div class="cm-lineNumbers"><div class="cm-gutterElement" /></div>
        </div>
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
            ? "height: 100%; width: var(--output-height); min-height: 0;"
            : ""}
    >
        {#if language == "p5" || language == "processing"}
            <div
                id="output-container"
                style={type == "vertical"
                    ? "height: 100%; overflow: hidden;"
                    : "width: 100%;"}
                class="rounded-scrollbar"
            >
                <div
                    bind:this={canvasContainer}
                    style="display: flex; flex-direction: column; width: 100%; height: 70%"
                />
                <div
                    bind:this={consoleOutput}
                    style="height: 30%; position: relative; z-index: 99; background-color: var(--main-output-bg-color);"
                >
                    <div
                        id="output-title-container"
                        style={type == "vertical"
                            ? `height: min(1.6vw, 3.2vh);`
                            : ""}
                    >
                        <p id="output-title">CONSOLE</p>
                    </div>
                    <div
                        bind:this={outputElement}
                        style="{iserror
                            ? 'color: var(--error-color);'
                            : ''} display: flex; flex-direction: column; width: 100%; height: calc(100% - min(1.6vw, 3.2vh); padding: 5px; box-sizing: border-box; white-space:pre-wrap; overflow: auto;"
                        class="output-text"
                    >
                        {output}
                    </div>
                </div>
            </div>
        {:else}
            <div
                id="output-title-container"
                style={type == "vertical"
                    ? `height: min(1.6vw, 3.2vh); margin-top: min(0.3vw, 0.6vh);`
                    : ""}
            >
                <p id="output-title">OUTPUT</p>
            </div>
            <!-- Output console.log -->
            <div
                id="output-container"
                style={type == "vertical"
                    ? `height: calc(100% - min(1.6vw, 3.2vh)} - min(0.3vw, 0.6vh));`
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
        {/if}
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
        height: min(1.6vw, 3.2vh);
        display: flex;
        align-items: center;
    }

    #output-title {
        margin: 0;
        height: 60%;
        margin-left: min(0.8vw, 1.6vh);
        font-size: min(0.9vw, 1.8vh);
        width: fit-content;
        border-bottom: 1px solid var(--output-text-color);
        color: var(--output-text-color);
        box-sizing: border-box;
    }

    #output-container {
        overflow: auto;
        height: calc(100% - min(1.6vw, 3.2vh));
        width: 100%;
    }

    .output-text {
        color: var(--output-text-color);
        padding: min(0.05vw, 0.1vh) 0 0 min(0.6vw, 1.2vh);
        margin: 0;
        font-family: monospace;
        font-size: min(1.1vw, 2.2vh);
        white-space: pre-wrap;
    }

    /* Code Mirror editor customization */
    .cm-editor {
        height: 100%;
        font-size: min(1.1vw, 2.2vh);
    }

    .cm-scroller {
        overflow: auto;
    }

    .ͼ1 .cm-lineNumbers .cm-gutterElement {
        padding: 0 min(0.3vw, 0.6vh) !important;
        min-width: unset !important;
    }

    .ͼ1 .cm-content {
        padding: min(0.1vw, 0.2vh) 0 !important;
    }

    .ͼ1 .cm-line {
        padding: 0 min(0.05vw, 0.025vh) 0 min(0.15vw, 0.075vh) !important;
    }

    .cm-tooltip-autocomplete.cm-tooltip.cm-tooltip-below {
        position: absolute !important;
        top: 0 !important;
        right: 0 !important;
        width: fit-content !important;
    }

    /* Split.js gutter customization */
    .gutter {
        width: min(0.2vw, 0.4vh) !important;
        height: 100%;
        z-index: 99;
        position: relative;
        background-color: rgb(150, 150, 150);
        background-repeat: no-repeat;
        background-position: 50%;
        transition: background-color 1s;
    }
    .gutter:hover {
        background-color: #466be5;
    }

    .gutter.gutter-vertical {
        height: min(0.2vw, 0.4vh) !important;
        width: 100% !important;
        background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAFAQMAAABo7865AAAABlBMVEVHcEzMzMzyAv2sAAAAAXRSTlMAQObYZgAAABBJREFUeF5jOAMEEAIEEFwAn3kMwcB6I2AAAAAASUVORK5CYII=");
        cursor: row-resize;
    }

    .gutter.gutter-horizontal {
        background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAeCAYAAADkftS9AAAAIklEQVQoU2M4c+bMfxAGAgYYmwGrIIiDjrELjpo5aiZeMwF+yNnOs5KSvgAAAABJRU5ErkJggg==");
        cursor: col-resize;
    }

    /* SQL output styling */
    table {
        margin: min(0.7vw, 1.4vh);
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
        box-shadow: inset 0 0 min(0.29vw, 0.6vh) rgba(0, 0, 0, 0.3);
        -webkit-box-shadow: inset 0 0 min(0.29vw, 0.6vh) rgba(0, 0, 0, 0.3);
        background-color: var(--dark-mode-main-output-bg-color-light);
    }

    *::-webkit-scrollbar {
        width: min(0.29vw, 0.6vh);
        background-color: var(--main-output-bg-color);
    }

    *::-webkit-scrollbar-thumb {
        box-shadow: inset 0 0 min(0.29vw, 0.6vh) rgba(0, 0, 0, 0.3);
        -webkit-box-shadow: inset 0 0 min(0.29vw, 0.6vh) rgba(0, 0, 0, 0.3);
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
