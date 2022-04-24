<svelte:options tag="default-editor" />

<script lang="ts">
    /**
     * PROPS
     */
    export let language = "javascript";
    export let darkmode = false;
    export let code = "";

    /**
     * IMPORTS
     */
    import JSTSWorker from "../modules/workers/jstsWorker?worker&inline";
    import { pythonWorkerFunction } from "../modules/workers/pythonWorker";
    import { Compartment } from "@codemirror/state";
    import {
        EditorState,
        EditorView,
        basicSetup,
    } from "@codemirror/basic-setup";
    import {
        readOnlyTransactionFilter,
        editableSelection,
    } from "../modules/readonly";
    import { lintGutter } from "@codemirror/lint";
    import { javascript } from "@codemirror/lang-javascript";
    import { java } from "@codemirror/lang-java";
    import { cpp } from "@codemirror/lang-cpp";
    import { python } from "@codemirror/lang-python";
    import { oneDark } from "@codemirror/theme-one-dark";
    import { typescript } from "../modules/typescript/index";
    import { onMount } from "svelte";

    /**
     * ELEMENTS
     */
    let editorElement;

    /**
     * GLOBAL VARIABLES
     */
    let worker;
    let editor;
    let runButtonDisabled = false,
        runButtonAnimating = false,
        runButtonRunning = false;
    let output = "";
    let outputError = false;

    const languageSelection = {
        javascript: [javascript(), lintGutter()],
        typescript: typescript(),
        cpp: cpp(),
        java: java(),
        python: python(),
    };

    // Disable Run Button
    function disableRunButton() {
        runButtonDisabled = true;
        runButtonRunning = true;
    }

    // Enable Run Button
    function enableRunButton() {
        runButtonDisabled = false;
        runButtonRunning = false;
    }

    function runCode(e) {
        e.preventDefault;
        runButtonAnimating = true;
        setTimeout(function () {
            runButtonAnimating = false;
        }, 700);
        disableRunButton();
        // Send to the worker the script to run
        worker.postMessage({
            language: language,
            script: editor.state.doc.toString(),
            input: "",
        });
    }

    onMount(() => {
        /**
         * Create a CodeMirror editor
         * @param querySelection DOM elements in which we want to create the editor
         * @param language Selected language for the editor
         * @param enableDarkMode Choose whether to enable the dark mode or not
         * @param initialText Text that should be present in the editor at startup
         * @returns The codemirror editor instance and a languageConfiguration compartment
         */
        function createEditor(
            element,
            language,
            enableDarkMode = false,
            initialText = ""
        ) {
            console.log("ENABLE DARK MODE", enableDarkMode);
            // Create a compartment to handle language configuration
            let languageConfiguration = new Compartment();

            // Define the extensions of the editor
            let extensions = [
                basicSetup,
                languageConfiguration.of(languageSelection[language]),
            ];

            // Check if the editor should be in dark mode
            if (enableDarkMode) extensions.push(oneDark);

            // Check if we should enable the mode in which we only allow to edit specific parts of the text
            let editableParts = [];
            if (initialText.includes("<EDITABLE>")) {
                extensions.push(readOnlyTransactionFilter());

                // Save all the editable parts of the text inside initialText in an array, where their start is marked with <EDITABLE> and their end is marked with </EDITABLE>
                let count = 0; // Count how many times we got a correspondence, to calculate the correct indices of the editable parts
                let regex = /(?<=<EDITABLE>)(.|\n)*?(?=<\/EDITABLE>)/gm,
                    result;
                while ((result = regex.exec(initialText)) !== null) {
                    count++;
                    // 10: length of <EDITABLE>
                    // 11: length of </EDITABLE>
                    editableParts.push({
                        from: result.index - 10 * count - 11 * (count - 1),
                        to:
                            result.index +
                            result[0].length -
                            10 * count -
                            11 * (count - 1),
                    });
                }
                // Remove the tokens <EDITABLE> and </EDITABLE> from the initialText
                initialText = initialText
                    .replace(/<EDITABLE>/gm, "")
                    .replace(/<\/EDITABLE>/gm, "");
            }

            // Create the editor
            let editor = new EditorView({
                state: EditorState.create({
                    doc: initialText,
                    extensions: extensions,
                }),
                parent: element,
            });

            // If the editable mode is enabled, we need to set the editable text selected by the user
            if (editableParts.length > 0) {
                editableParts.forEach((part) => {
                    editableSelection(editor, part.from, part.to);
                });
            }

            // Return the editor and the languages handler
            return {
                editor,
                languageConfiguration,
            };
        }

        // Create the CodeMirror editor
        let res = createEditor(editorElement, language, darkmode, code);

        // Get access to the editor instance
        editor = res.editor;

        if (language == "python") {
            // Get the body of the worker's function
            var workerJob = pythonWorkerFunction
                .toString()
                .slice(
                    pythonWorkerFunction.toString().indexOf("{") + 1,
                    pythonWorkerFunction.toString().lastIndexOf("}")
                );
            // Generate a blob from it
            var workerBlob = new Blob([workerJob], { type: "text/javascript" });
            // The worker constructor needs an URL: create it from the blob
            worker = new Worker(window.URL.createObjectURL(workerBlob));
        } else if (language == "javascript" || language == "typescript") {
            worker = new JSTSWorker();
        }

        // Handle the worker's messages
        worker.onmessage = (e) => {
            enableRunButton();
            if (e.data.error) {
                outputError = true;
                output = e.data.error;
            } else {
                outputError = false;
                let text = "";
                if (e.data.debug) text += e.data.debug + "\n\n";
                if (e.data.result) text += "Result: " + e.data.result;
                output = text;
            }
        };
    });
</script>

<div style="display: none;" class="cm-editor cm-scroller" />
<div id="code-container">
    <!-- Run Button -->
    <div id="play-container">
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
    <!-- Complete editor -->
    <div id="editor-container">
        <!-- CodeMirror Editor -->
        <div bind:this={editorElement} id="editor" />
        <!-- Output -->
        <div id="editor-output">
            <div id="output-title-container">
                <p id="output-title">OUTPUT</p>
            </div>
            <!-- Output console.log -->
            <div id="output-container" class="rounded-scrollbar">
                <p class="output-text {outputError ? 'error' : ''}" id="output">
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
        /* Main Light Mode */
        --main-output-bg-color: #282c34;
        --main-output-bg-color-light: #333235;
        --main-output-text-color: #fffeff;

        /* Dark Mode */
        --dark-mode-main-output-bg-color: #f5f5f5;
        --dark-mode-main-output-text-color: black;

        /* Common */
        --error-color: red;
        --run-btn-main-color: #00cc3d;
        --run-btn-active-color: #00aa33;
        --run-btn-shadow-color: #00cc3d81;
        --run-btn-active-shadow-color: #00cc3d3d;
        --output-height: 30%;
    }

    /* Main elements Customization */
    /* ------------------------------------------------ */
    .error {
        color: var(--error-color);
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
        right: 3%;
        top: 5%;
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

    #editor-output,
    #editor-input {
        background-color: var(--main-output-bg-color);
        color: var(--main-output-text-color);
        height: var(--output-height);
    }

    #output-title-container,
    #input-title-container {
        height: 3vmin;
        display: flex;
        align-items: center;
    }

    #output-title,
    #input-title {
        margin: 0;
        height: 60%;
        margin-left: 0.8vw;
        font-size: 1.6vmin;
        width: fit-content;
        border-bottom: 1px solid white;
        color: white;
        box-sizing: border-box;
    }

    #output-container,
    #input-container {
        overflow: auto;
        height: calc(100% - 3vmin);
        width: 100%;
    }

    .output-text,
    .input-text {
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
        /* border-radius: 10px; */
        background-color: var(--dark-mode-main-output-bg-color-light);
    }

    *::-webkit-scrollbar {
        width: 12px;
        background-color: var(--main-output-bg-color);
    }

    *::-webkit-scrollbar-thumb {
        /* border-radius: 10px; */
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
