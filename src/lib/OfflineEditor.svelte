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
    import interact from "interactjs";

    /**
     * ELEMENTS
     */

    let editorElement: HTMLElement,
        rootElement: HTMLElement,
        copyContainer: HTMLElement,
        tabsContainer: HTMLElement,
        outputContainer: HTMLElement,
        outputTitleContainer: HTMLElement;

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
    function runCode(_e: Event) {
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

    onMount(() => {
        // Make the outputcontainer resizable
        interact(outputContainer).resizable({
            modifiers: [
                interact.modifiers.restrictSize({
                    min: {
                        width: 0,
                        height: outputTitleContainer.clientHeight,
                    },
                    max: {
                        width: rootElement.clientWidth,
                        height: rootElement.clientHeight,
                    },
                }),
            ],
            edges: {
                left: type == "vertical" ? true : false,
                right: true,
                bottom: false,
                top: type == "vertical" ? false : true,
            },
            listeners: {
                move: function (event) {
                    let { x, y } = event.target.dataset;

                    x = (parseFloat(x) || 0) + event.deltaRect.left;
                    y = (parseFloat(y) || 0) + event.deltaRect.top;

                    Object.assign(event.target.style, {
                        width: `${event.rect.width}px`,
                        height: `${event.rect.height}px`,
                        // transform: `translate(${x}px, ${y}px)`,
                    });

                    // Resize consequently the editorElement
                    if (type == "normal") {
                        editorElement.style.height = `${
                            rootElement.clientHeight - event.rect.height
                        }px`;
                    } else {
                        editorElement.style.width = `${
                            rootElement.clientWidth - event.rect.width
                        }px`;
                    }

                    Object.assign(event.target.dataset, { x, y });
                },
            },
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

        // Create the CodeMirror editor
        let res = createEditor(editorElement, language, theme == "dark", code);

        // Get access to the editor instance
        codeMirrorEditor = res.editor;
        tabsConfiguration = res.tabsConfiguration;

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
        webworker.onmessage = (message) => {
            enableRunButton();
            if (message.data.error) {
                outputError = true;
                output = message.data.error;
            } else {
                outputError = false;
                let text = "";
                if (message.data.debug) text += message.data.debug + "\n\n";
                if (message.data.result)
                    text += "Result: " + message.data.result;
                output = text;
            }
        };
    });
</script>

<!-- Workaround to make vite load cm-editor and cm-scroller custom styles -->
<div style="display: none;" class="cm-editor cm-scroller" />

<!-- Editor's HTML -->
<div bind:this={rootElement} id="code-container">
    <!-- Overlay Message -->
    <div
        style="{messageShowing ? 'opacity: 1;' : 'opacity: 0;'} {type ==
        'vertical'
            ? 'top: 50%'
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
            : "right: 3%; top: 5%;"}
    >
        <button
            id="run-button"
            on:click={runCode}
            class="{runButtonRunning ? 'running' : ''} {runButtonAnimating
                ? 'animate'
                : ''}"
            disabled={runButtonDisabled}
            >{runButtonRunning ? "Running..." : "Run Code!"}</button
        >
    </div>

    <!-- Tabs Handling Button -->
    <div
        bind:this={tabsContainer}
        style={type == "vertical"
            ? "right: calc(var(--output-height) + 1vw); top: calc(8% + 4.5vmin);"
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
                fill={tabsEnabled ? "#33ff3a" : "#ff4133"}
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
            ? "right: calc(var(--output-height) + 1vw); top: 5%;"
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

    <!-- Complete editor -->
    <div
        id="editor-container"
        style={type == "vertical"
            ? "display: flex; justify-content: space-between;"
            : ""}
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
                bind:this={outputTitleContainer}
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
        padding: 0.3vmin;
        position: absolute;
        width: 4.5vmin;
        height: 4.5vmin;
        right: 3%;
        bottom: calc(3% + var(--output-height));
        z-index: 10;
    }

    #copy-container {
        box-sizing: border-box;
        padding: 0.3vmin;
        position: absolute;
        width: 4.5vmin;
        height: 4.5vmin;
        right: 3%;
        bottom: calc(6% + 4.5vmin + var(--output-height));
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
        display: inline-block;
        font-size: 2.2vmin;
        font-weight: 400;
        padding: 2vmin 2.5vmin;
        margin-top: 0;
        -webkit-appearance: none;
        appearance: none;
        background-color: var(--run-btn-main-color);
        color: #fff;
        border-radius: 4px;
        border: none;
        cursor: pointer;
        position: relative;
        transition: transform ease-in 0.1s, box-shadow ease-in 0.25s;
        box-shadow: 0 2px 25px var(--run-btn-shadow-color);
    }

    #run-button:focus {
        outline: 0;
    }

    #run-button:before,
    #run-button:after {
        position: absolute;
        content: "";
        display: block;
        width: 140%;
        height: 100%;
        left: -20%;
        z-index: -1000;
        transition: all ease-in-out 0.5s;
        background-repeat: no-repeat;
    }

    #run-button:before {
        display: none;
        top: -75%;
        background-image: radial-gradient(
                circle,
                var(--run-btn-main-color) 20%,
                transparent 20%
            ),
            radial-gradient(
                circle,
                transparent 20%,
                var(--run-btn-main-color) 20%,
                transparent 30%
            ),
            radial-gradient(
                circle,
                var(--run-btn-main-color) 20%,
                transparent 20%
            ),
            radial-gradient(
                circle,
                var(--run-btn-main-color) 20%,
                transparent 20%
            ),
            radial-gradient(
                circle,
                transparent 10%,
                var(--run-btn-main-color) 15%,
                transparent 20%
            ),
            radial-gradient(
                circle,
                var(--run-btn-main-color) 20%,
                transparent 20%
            ),
            radial-gradient(
                circle,
                var(--run-btn-main-color) 20%,
                transparent 20%
            ),
            radial-gradient(
                circle,
                var(--run-btn-main-color) 20%,
                transparent 20%
            ),
            radial-gradient(
                circle,
                var(--run-btn-main-color) 20%,
                transparent 20%
            );
        background-size: 10% 10%, 20% 20%, 15% 15%, 20% 20%, 18% 18%, 10% 10%,
            15% 15%, 10% 10%, 18% 18%;
    }

    #run-button:after {
        display: none;
        bottom: -75%;
        background-image: radial-gradient(
                circle,
                var(--run-btn-main-color) 20%,
                transparent 20%
            ),
            radial-gradient(
                circle,
                var(--run-btn-main-color) 20%,
                transparent 20%
            ),
            radial-gradient(
                circle,
                transparent 10%,
                var(--run-btn-main-color) 15%,
                transparent 20%
            ),
            radial-gradient(
                circle,
                var(--run-btn-main-color) 20%,
                transparent 20%
            ),
            radial-gradient(
                circle,
                var(--run-btn-main-color) 20%,
                transparent 20%
            ),
            radial-gradient(
                circle,
                var(--run-btn-main-color) 20%,
                transparent 20%
            ),
            radial-gradient(
                circle,
                var(--run-btn-main-color) 20%,
                transparent 20%
            );
        background-size: 15% 15%, 20% 20%, 18% 18%, 20% 20%, 15% 15%, 10% 10%,
            20% 20%;
    }

    #run-button:active {
        transform: scale(0.9);
        background-color: var(--run-btn-active-color);
        box-shadow: 0 2px 25px var(--run-btn-active-shadow-color);
    }

    #run-button.animate:before {
        display: block;
        animation: topBubbles ease-in-out 0.75s forwards;
    }

    #run-button.animate:after {
        display: block;
        animation: bottomBubbles ease-in-out 0.75s forwards;
    }

    #run-button.running {
        background-color: #474747;
        box-shadow: 0 2px 25px #3a3a3a;
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
