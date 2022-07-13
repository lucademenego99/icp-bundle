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
        | "java" = "javascript";
    export let type: "normal" | "vertical" = "normal";
    export let theme: "light" | "dark" = "light";
    export let code = "";

    /**
     * IMPORTS
     */

    import JSTSWorker from "../modules/workers/jstsWorker?worker&inline";
    import { pythonWorkerFunction } from "../modules/workers/pythonWorkerOffline";
    import { onMount } from "svelte";
    import { createEditor, setTabsHandling } from "../utils";
    import type { EditorView } from "@codemirror/view";
    import type { Compartment } from "@codemirror/state";
    import Split from "split.js";

    /**
     * ELEMENTS
     */

    let editorElement: HTMLElement,
        rootElement: HTMLElement,
        copyContainer: HTMLElement,
        tabsContainer: HTMLElement,
        resetContainer: HTMLElement,
        outputContainer: HTMLElement,
        runButtonElement: HTMLElement;

    /**
     * GLOBAL VARIABLES
     */

    let webworker: Worker;
    let codeMirrorEditor: EditorView, tabsConfiguration: Compartment;
    let runButtonDisabled = false,
        runButtonAnimating = false,
        runButtonRunning = false;
    let output = "",
        outputError = false;
    let tabsEnabled = false;
    let messageToShow = "",
        messageShowing = false;

    /**
     * Disable the run Button
     */
    function disableRunButton() {
        runButtonDisabled = true;
        runButtonRunning = true;
    }

    /**
     * Enable the run Button
     */
    function enableRunButton() {
        runButtonDisabled = false;
        runButtonRunning = false;
    }

    /**
     * Run provided code
     */
    function runCode(_event: Event) {
        // If the code is already running, interrupt the execution instead
        if (runButtonRunning) {
            interruptExecution();
            return;
        }

        runButtonAnimating = true;
        setTimeout(function () {
            runButtonAnimating = false;
        }, 700);
        disableRunButton();
        let baseurl =
            document.location.protocol +
            "//" +
            document.location.host +
            document.location.pathname;
        baseurl = baseurl.substring(0, baseurl.lastIndexOf("/"));
        baseurl += "/utils/python/pyodide/";
        // Send to the webworker the script to run
        webworker.postMessage({
            language: language,
            script: codeMirrorEditor.state.doc.toString(),
            input: "",
            baseUrl: baseurl,
        });
    }

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
     * create the web worker that will compile and run the code
     */
    function setupWorker() {
        if (language == "python") {
            try {
                // webworker = new Worker("./runtime/python/worker.js");
                // webworker = new Worker("/runtime/python/worker.js");
                // Get the body of the webworker's function
                var workerJob = pythonWorkerFunction
                    .toString()
                    .slice(
                        pythonWorkerFunction.toString().indexOf("{") + 1,
                        pythonWorkerFunction.toString().lastIndexOf("}")
                    );
                // Generate a blob from it
                var workerBlob = new Blob([workerJob], {
                    type: "text/javascript",
                });
                // The webworker constructor needs an URL: create it from the blob
                webworker = new Worker(window.URL.createObjectURL(workerBlob));
            } catch {}
        } else if (language == "javascript" || language == "typescript") {
            webworker = new JSTSWorker();
        } else if (language == "java") {
            try {
                webworker = new Worker("./utils/java/worker.js");
            } catch {}
        }

        // Handle the webworker's messages
        webworker.onmessage = onWorkerMessage;
    }

    /**
     * Handler of the webworker's message
     * @param message message received from the webworker
     */
    function onWorkerMessage(message: any) {
        enableRunButton();
        if (message.data.error) {
            outputError = true;
            output =
                language == "python"
                    ? "[line " + message.data.line + "] " + message.data.error
                    : message.data.error;
        } else {
            outputError = false;
            let text = "";
            if (message.data.debug) text += message.data.debug + "\n\n";
            if (message.data.result) text += "'" + message.data.result + "'";
            output = text;
        }
    }

    onMount(() => {
        // Make editor and output splitted and resizable using split.js
        Split([editorElement, outputContainer], {
            minSize: 40,
            gutterSize: 5,
            sizes: [70, 30],
            direction: type == "normal" ? "vertical" : "horizontal",
        });

        // Set theme CSS properties
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

        // Define the behavior of the copy button when clicked
        copyContainer.addEventListener("click", (e) => {
            var copyText = codeMirrorEditor.state.doc.toString();
            navigator.clipboard.writeText(copyText);
            showMessage("Text Copied!");
        });

        // Define the behavior of the tabs button when clicked
        tabsContainer.addEventListener("click", (e) => {
            tabsEnabled = !tabsEnabled;
            setTabsHandling(codeMirrorEditor, tabsConfiguration, tabsEnabled);
            showMessage(
                tabsEnabled ? "Tabs handling enabled" : "Tabs handling disabled"
            );
        });

        // Define the behavior of the reset button when clicked
        resetContainer.addEventListener("click", (e) => {
            codeMirrorEditor.dispatch({
                changes: [
                    {
                        from: 0,
                        to: codeMirrorEditor.state.doc.length,
                        insert: code,
                    },
                ],
            });
            showMessage("Code resetted!");
        });

        // Create the CodeMirror editor
        let res;
        if (!codeMirrorEditor) {
            res = createEditor(editorElement, language, theme == "dark", code);
        }

        // Get access to the editor instance
        codeMirrorEditor = res.editor;
        tabsConfiguration = res.tabsConfiguration;

        setupWorker();
    });

    // Allow to interrupt the code's execution
    function interruptExecution() {
        console.warn("Interrupting Code Execution");
        // Terminate the worker without waiting for the end of the execution
        webworker.terminate();
        // Re-create the worker
        setupWorker();
        enableRunButton();
    }
</script>

<!-- Workaround to make vite load custom styles -->
<div
    style="display: none;"
    class="gutter gutter-vertical gutter-horizontal cm-editor cm-scroller"
/>

<!-- Editor's HTML -->
<div bind:this={rootElement} id="code-container">
    <!-- Overlay Message -->
    <div
        style="{messageShowing ? 'opacity: 1;' : 'opacity: 0;'} {type ==
        'vertical'
            ? 'width: 50%; left: 35%; top: 50%;'
            : ''}"
        id="message"
    >
        {messageToShow}
    </div>

    <!-- Run Button -->
    <div
        id="play-container"
        style={type == "vertical"
            ? "right: calc(var(--output-height) + 2.2vw); bottom: 5%;"
            : "right: 0; top: -38px;"}
    >
        <button bind:this={runButtonElement} id="run-button" on:click={runCode}>
            <p>{runButtonRunning ? "Cancel" : "Run"}</p>
            {#if runButtonRunning}
                <svg
                    width="22"
                    height="22"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M10 0C4.47 0 0 4.47 0 10C0 15.53 4.47 20 10 20C15.53 20 20 15.53 20 10C20 4.47 15.53 0 10 0ZM15 13.59L13.59 15L10 11.41L6.41 15L5 13.59L8.59 10L5 6.41L6.41 5L10 8.59L13.59 5L15 6.41L11.41 10L15 13.59Z"
                        fill="#FF4133"
                    />
                </svg>
            {:else}
                <svg
                    width="22"
                    height="22"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M16 8C16 10.1217 15.1571 12.1566 13.6569 13.6569C12.1566 15.1571 10.1217 16 8 16C5.87827 16 3.84344 15.1571 2.34315 13.6569C0.842855 12.1566 0 10.1217 0 8C0 5.87827 0.842855 3.84344 2.34315 2.34315C3.84344 0.842855 5.87827 0 8 0C10.1217 0 12.1566 0.842855 13.6569 2.34315C15.1571 3.84344 16 5.87827 16 8V8ZM6.79 5.093C6.71524 5.03977 6.62726 5.00814 6.53572 5.00159C6.44418 4.99503 6.35259 5.01379 6.27101 5.05583C6.18942 5.09786 6.12098 5.16154 6.07317 5.23988C6.02537 5.31823 6.00006 5.40822 6 5.5V10.5C6.00006 10.5918 6.02537 10.6818 6.07317 10.7601C6.12098 10.8385 6.18942 10.9021 6.27101 10.9442C6.35259 10.9862 6.44418 11.005 6.53572 10.9984C6.62726 10.9919 6.71524 10.9602 6.79 10.907L10.29 8.407C10.3548 8.36075 10.4076 8.29968 10.4441 8.22889C10.4806 8.1581 10.4996 8.07963 10.4996 8C10.4996 7.92037 10.4806 7.8419 10.4441 7.77111C10.4076 7.70031 10.3548 7.63925 10.29 7.593L6.79 5.093V5.093Z"
                        fill="#00CC3D"
                    />
                </svg>
            {/if}
        </button>
    </div>

    <!-- Tabs Handling Button -->
    <div
        bind:this={tabsContainer}
        style={type == "vertical"
            ? "right: calc(var(--output-height) + 1vw); top: 8vmin;"
            : ""}
        id="tabs-container"
    >
        <svg
            version="1.0"
            xmlns="http://www.w3.org/2000/svg"
            height="100%"
            viewBox="0 0 128.000000 128.000000"
            preserveAspectRatio="xMidYMid meet"
        >
            <g
                id="tabs-svg"
                transform="translate(0.000000,128.000000) scale(0.100000,-0.100000)"
                fill={tabsEnabled ? "#00cc3d" : "#ff4133"}
                stroke="none"
            >
                <path
                    d="M71 1262 c-19 -10 -43 -34 -53 -53 -17 -31 -18 -70 -18 -569 0 -499
1 -538 18 -569 10 -19 34 -43 53 -53 31 -17 70 -18 569 -18 499 0 538 1 569
18 19 10 43 34 53 53 17 31 18 70 18 569 0 499 -1 538 -18 569 -10 19 -34 43
-53 53 -31 17 -70 18 -569 18 -499 0 -538 -1 -569 -18z m1131 -60 l23 -23 0
-539 0 -539 -23 -23 -23 -23 -539 0 -539 0 -23 23 -23 23 -2 527 c-2 410 0
533 10 552 26 50 24 50 589 47 l527 -2 23 -23z"
                />
                <path
                    d="M1016 834 c-3 -9 -6 -52 -6 -97 l0 -81 -90 88 c-76 74 -92 86 -105
76 -23 -19 -19 -27 42 -91 l56 -59 -365 0 c-313 0 -367 -2 -378 -15 -10 -12
-10 -18 0 -30 11 -13 65 -15 378 -15 l365 0 -56 -59 c-61 -64 -65 -72 -42 -91
13 -10 29 2 105 76 l90 88 0 -81 c0 -45 3 -88 6 -97 8 -21 40 -21 48 0 8 20 8
368 0 388 -3 9 -14 16 -24 16 -10 0 -21 -7 -24 -16z"
                />
            </g>
        </svg>
    </div>

    <!-- Copy Code Button -->
    <div
        bind:this={copyContainer}
        style={type == "vertical"
            ? "right: calc(var(--output-height) + 1vw); top: 4.5vmin;"
            : ""}
        id="copy-container"
    >
        <svg
            version="1.0"
            xmlns="http://www.w3.org/2000/svg"
            height="100%"
            viewBox="0 0 128.000000 128.000000"
            preserveAspectRatio="xMidYMid meet"
        >
            <g
                transform="translate(0.000000,128.000000) scale(0.100000,-0.100000)"
                fill="#00cc3d"
                stroke="none"
            >
                <path
                    d="M26 1254 l-26 -27 0 -467 0 -467 26 -27 c22 -22 36 -26 80 -26 l54 0
0 40 0 40 -40 0 -40 0 0 440 0 440 440 0 440 0 0 -40 0 -40 40 0 40 0 0 54 c0
44 -4 58 -26 80 l-27 26 -467 0 -467 0 -27 -26z"
                />
                <path
                    d="M266 1014 l-26 -27 0 -467 0 -467 26 -27 27 -26 467 0 467 0 27 26
26 27 0 467 0 467 -26 27 -27 26 -467 0 -467 0 -27 -26z m934 -494 l0 -440
-440 0 -440 0 0 440 0 440 440 0 440 0 0 -440z"
                />
            </g>
        </svg>
    </div>

    <!-- Reset Button -->
    <div
        bind:this={resetContainer}
        style={type == "vertical"
            ? "right: calc(var(--output-height) + 1vw); top: 1vmin;"
            : ""}
        id="reset-container"
    >
        <svg
            height="100%"
            viewBox="0 0 44 42"
            fill="#ff4133"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M39.875 9H7.09875L12.9162 3.16625L10.625 0.875L0.875 10.625L10.625 20.375L12.9162 18.0838L7.09875 12.25H39.875V38.25H7.375V26.875H4.125V38.25C4.125 39.112 4.46741 39.9386 5.0769 40.5481C5.6864 41.1576 6.51305 41.5 7.375 41.5H39.875C40.737 41.5 41.5636 41.1576 42.1731 40.5481C42.7826 39.9386 43.125 39.112 43.125 38.25V12.25C43.125 11.388 42.7826 10.5614 42.1731 9.9519C41.5636 9.34241 40.737 9 39.875 9V9Z"
            />
        </svg>
    </div>

    <!-- Complete editor -->
    <div
        id="editor-container"
        style={type == "vertical"
            ? "display: flex; flex-direction: row; justify-content: space-between;"
            : "display: flex; flex-direction: column;"}
    >
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
                style={type == "vertical"
                    ? "height: 3vmin; margin-top: 1vh;"
                    : ""}
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
                <p
                    style={outputError ? "color: var(--error-color);" : ""}
                    class="output-text"
                    id="output"
                >
                    {output}
                </p>
            </div>
        </div>
    </div>
</div>

<style>
    /* Useful variables */
    /* ------------------------------------------------ */
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

    #play-container {
        position: absolute;
        z-index: 10;
    }

    #editor-container {
        height: 100%;
        width: 100%;
        box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
    }

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

    #editor {
        height: calc(100% - var(--output-height));
    }

    #message {
        transition: 500ms;
        position: absolute;
        text-align: center;
        width: 70%;
        pointer-events: none;
        font-family: monospace;
        z-index: 20;
        font-size: 2vmin;
        top: 40%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: black;
        color: white;
    }

    #tabs-container {
        box-sizing: border-box;
        padding: 0.5vmin;
        position: absolute;
        width: 3.5vmin;
        height: 3.5vmin;
        right: 2%;
        bottom: calc(1vmin + var(--output-height));
        z-index: 10;
    }

    #copy-container {
        box-sizing: border-box;
        padding: 0.5vmin;
        position: absolute;
        width: 3.5vmin;
        height: 3.5vmin;
        right: 2%;
        bottom: calc(4.5vmin + var(--output-height));
        z-index: 10;
    }

    #reset-container {
        box-sizing: border-box;
        padding: 0.5vmin;
        position: absolute;
        width: 3.5vmin;
        height: 3.5vmin;
        right: 2%;
        bottom: calc(8vmin + var(--output-height));
        z-index: 10;
    }

    svg {
        transition: transform 0.2s;
        cursor: pointer;
    }

    svg:hover {
        transform: scale(1.5);
    }

    #editor-output {
        z-index: 99;
        box-sizing: border-box;
        background-color: var(--main-output-bg-color);
        color: var(--main-output-text-color);
        height: var(--output-height);
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

    /* CodeMirror Customization */
    /* ------------------------------------------------ */
    .cm-editor {
        height: 100%;
        font-size: 2vmin;
    }

    .cm-scroller {
        overflow: auto;
    }

    /* Run Button Customization */
    /* ------------------------------------------------ */
    #run-button {
        display: flex;
        gap: 0.4rem;
        justify-content: center;
        align-items: center;
        margin: 0;
        padding: 8px 12px;
        -webkit-appearance: none;
        appearance: none;
        background-color: var(--run-button-bg-color);
        color: var(--run-button-text-color);
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;
        border: none;
        cursor: pointer;
        position: relative;
        transition: background-color 0.2s linear;
        box-shadow: 2px -7px 17px -5px rgba(0,0,0,0.35);
        /* transition: transform ease-in 0.1s, box-shadow ease-in 0.25s; */
        /* box-shadow: 0 2px 25px var(--run-btn-shadow-color); */
    }

    #run-button p {
        margin: 0;
        padding: 0;
    }

    #run-button:hover {
        background-color: var(--run-button-bg-color-hover);
    }

    #run-button svg:hover {
        transform: none;
    }

    #run-button:focus {
        outline: 0;
    }

    /* Custom Scrollbar Design */
    /* ------------------------------------------------ */
    *::-webkit-scrollbar-track {
        box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
        -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
        background-color: var(--dark-mode-main-output-bg-color-light);
    }

    *::-webkit-scrollbar {
        width: 12px;
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

    /* Animations */
    /* ------------------------------------------------ */
    @keyframes topBubbles {
        0% {
            background-position: 5% 90%, 10% 90%, 10% 90%, 15% 90%, 25% 90%,
                25% 90%, 40% 90%, 55% 90%, 70% 90%;
        }

        50% {
            background-position: 0% 80%, 0% 20%, 10% 40%, 20% 0%, 30% 30%,
                22% 50%, 50% 50%, 65% 20%, 90% 30%;
        }

        100% {
            background-position: 0% 70%, 0% 10%, 10% 30%, 20% -10%, 30% 20%,
                22% 40%, 50% 40%, 65% 10%, 90% 20%;
            background-size: 0% 0%, 0% 0%, 0% 0%, 0% 0%, 0% 0%, 0% 0%;
        }
    }

    @keyframes bottomBubbles {
        0% {
            background-position: 10% -10%, 30% 10%, 55% -10%, 70% -10%, 85% -10%,
                70% -10%, 70% 0%;
        }

        50% {
            background-position: 0% 80%, 20% 80%, 45% 60%, 60% 100%, 75% 70%,
                95% 60%, 105% 0%;
        }

        100% {
            background-position: 0% 90%, 20% 90%, 45% 70%, 60% 110%, 75% 80%,
                95% 70%, 110% 10%;
            background-size: 0% 0%, 0% 0%, 0% 0%, 0% 0%, 0% 0%, 0% 0%;
        }
    }
</style>
