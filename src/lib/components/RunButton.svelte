<svelte:options tag="run-button" />

<script lang="ts">
    /**
     * IMPORTS
     */
    import { onMount } from "svelte";
    import type { EditorView } from "@codemirror/view";

    type Table = {
        columns: string[];
        values: any[][];
    };

    /**
     * PROPS
     */
    export let type: "normal" | "vertical" = "normal";
    export let language:
        | "javascript"
        | "typescript"
        | "python"
        | "cpp"
        | "java"
        | "sql";
    export let editor: EditorView;
    export let offline: boolean = false;
    export let webworker: Worker | SharedWorker;

    /**
     * ELEMENTS
     */
    let ref: HTMLElement;

    /**
     * VARIABLES
     */
    let output: string;
    let outputError: boolean;
    let runButtonRunning = false;

    // Dispatch an event "changedout" when the output changes
    // The parent will listen to this event and update the output accordingly
    $: {
        const event = new CustomEvent("changedout", {
            detail: {
                output,
                outputError,
            },
            bubbles: true,
            cancelable: true,
            composed: true,
        });
        ref?.dispatchEvent(event);
    }

    $: {
        if (webworker) {
            console.log(webworker);
            // Handle the webworker's messages
            if (language == "python") {
                (webworker as SharedWorker).port.onmessage = onWorkerMessage;
                (webworker as SharedWorker).port.start();
            } else {
                console.log("Initialized worker for language " + language);
                (webworker as Worker).onmessage = onWorkerMessage;
            }
        }
    }

    /**
     * FUNCTIONS
     */

    /**
     * Setup the worker responsible for executing code when mounting the component
     */
    onMount(() => {
        // setupWorker();
    });

    /**
     * Create an HTML table from the output of a SQL.js query
     * Only used when language == "sql"
     * @param output The output of the SQLWorker
     */
    function createHTMLTable(output: Table) {
        const table = document.createElement("table");
        const thead = document.createElement("thead");
        const tbody = document.createElement("tbody");
        table.appendChild(thead);
        table.appendChild(tbody);
        const tr = document.createElement("tr");
        thead.appendChild(tr);
        output.columns.forEach((column) => {
            const th = document.createElement("th");
            th.textContent = column;
            tr.appendChild(th);
        });
        output.values.forEach((row) => {
            const tr = document.createElement("tr");
            tbody.appendChild(tr);
            row.forEach((value) => {
                const td = document.createElement("td");
                td.textContent = value;
                tr.appendChild(td);
            });
        });
        return table;
    }

    /**
     * Handler of the webworker's message
     * @param message message received from the webworker
     */
    function onWorkerMessage(message: any) {
        runButtonRunning = false;
        if (message.data.error) {
            outputError = true;
            console.log(message.data);
            output =
                language == "python"
                    ? "[line " + message.data.line + "] " + message.data.error
                    : message.data.error;
        } else {
            outputError = false;

            if (language == "sql") {
                if (
                    message.data.result &&
                    Array.isArray(message.data.result) &&
                    message.data.result.length > 0
                ) {
                    // For each table in output generate the HTML table
                    const tables = message.data.result.map(
                        (table) => createHTMLTable(table).outerHTML
                    );
                    output = tables.join("<br>");
                } else {
                    output = "";
                }
            } else {
                let text = "";
                if (message.data.debug) text += message.data.debug + "\n\n";
                if (message.data.result)
                    text += "'" + message.data.result + "'";
                output = text;
            }
        }
    }

    // /**
    //  * Setup the worker responsible for executing code.
    //  * In general we would like to use SharedWorkers, because
    //  * in this way they will only be created once and will be reused
    //  * for all the instances of ICP.
    //  *
    //  * In some cases, however, Workers are the only option (Java)
    //  */
    // function setupWorker() {
    //     if (language == "python" && !offline) {
    //         // webworker = new SharedWorker(
    //         //     new URL("../../modules/workers/pythonWorker", import.meta.url),
    //         //     {
    //         //         name: "Python Worker",
    //         //     }
    //         // );
    //         webworker = new SharedWorker(PythonWorker);
    //     } else if (language == "python" && offline) {
    //         // webworker = new SharedWorker(
    //         //     new URL(
    //         //         "../../modules/workers/pythonWorkerOffline",
    //         //         import.meta.url
    //         //     ),
    //         //     {
    //         //         name: "Python Worker",
    //         //     }
    //         // );
    //         webworker = new SharedWorker(PythonOfflineWorker);
    //     } else if (language == "javascript" || language == "typescript") {
    //         // webworker = new SharedWorker(
    //         //     new URL("../../modules/workers/jstsWorker", import.meta.url),
    //         //     {
    //         //         type: "module",
    //         //         name: "Javascript/Typescript Worker",
    //         //     }
    //         // );
    //         webworker = new JstsWorker();
    //     } else if (language == "java") {
    //         // We use a simple Worker for Java since the script javaClasses.js
    //         // used to run Java code has been created as a normal worker.
    //         // In the future we could think of modifying it (teavm-javac) to
    //         // allow it to be used as a SharedWorker
    //         // webworker = new Worker(
    //         //     new URL("../../modules/workers/javaWorker", import.meta.url),
    //         //     {
    //         //         type: "module",
    //         //         name: "Java Worker",
    //         //     }
    //         // );
    //         webworker = new JavaWorker();
    //     } else if (language == "sql") {
    //         // We use a Worker for SQL since otherwise every instance of ICP would
    //         // connect to the same database, which is not what we usually want
    //         // webworker = new Worker(
    //         //     new URL("../../modules/workers/sqlWorker", import.meta.url),
    //         //     {
    //         //         type: "module",
    //         //         name: "Sql Worker",
    //         //     }
    //         // );
    //         webworker = new SqlWorker();
    //     }

    //     // Handle the webworker's messages
    //     if (language == "java" || language == "sql") {
    //         (webworker as Worker).onmessage = onWorkerMessage;
    //     } else {
    //         (webworker as SharedWorker).port.onmessage = onWorkerMessage;
    //         (webworker as SharedWorker).port.start();
    //     }
    // }

    /**
     * Interrupt the current code execution
     */
    function interruptExecution() {
        console.warn("Interrupting Code Execution");
        // Terminate the worker without waiting for the end of the execution
        if (language == "python") {
            (webworker as SharedWorker).port.close();
        } else {
            (webworker as Worker).terminate();
        }
        // Re-create the worker
        // setupWorker();
        runButtonRunning = false;
    }

    /**
     * Run the provided code
     */
    function runCode(_event: Event) {
        // If the code is already running, interrupt the execution instead
        if (runButtonRunning) {
            interruptExecution();
            return;
        }

        runButtonRunning = true;

        // Define the baseUrl used for pyodide to load the packages
        // when in offline mode
        let baseUrl = "";
        if (offline) {
            baseUrl =
                document.location.protocol +
                "//" +
                document.location.host +
                document.location.pathname;
            baseUrl = baseUrl.substring(0, baseUrl.lastIndexOf("/"));
            baseUrl +=
                language == "python"
                    ? "/utils/python/pyodide/"
                    : "/utils/java/";
        }

        // Define the message to send to the worker
        const message = {
            offline: offline,
            language: language,
            script: editor.state.doc.toString(),
            input: "",
            baseUrl: baseUrl,
        };

        // Send to the webworker the script to run
        if (language == "python") {
            (webworker as SharedWorker).port.postMessage(message);
        } else {
            (webworker as Worker).postMessage(message);
        }
    }
</script>

<div
    bind:this={ref}
    id="play-container"
    style={type == "vertical"
        ? "right: calc(var(--output-height) + 10px); bottom: 5px"
        : "right: 10px; bottom: calc(var(--output-height) + 10px)"}
>
    <button
        on:click={runCode}
        disabled={webworker == undefined}
        id="run-button"
        style="width: 40px; height: 40px; border-radius: 50%; background-color: {webworker !=
        undefined
            ? runButtonRunning
                ? '#ff4133'
                : '#00CC3D'
            : '#5f5f5f'}"
    >
        {#if runButtonRunning}
            <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M8.59 0L5 3.59L1.41 0L0 1.41L3.59 5L0 8.59L1.41 10L5 6.41L8.59 10L10 8.59L6.41 5L10 1.41L8.59 0Z"
                    fill="white"
                />
            </svg>
        {:else}
            <svg
                style="width: 24px; height: 24px; fill: white;"
                viewBox="0 0 24 24"
            >
                <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
            </svg>
        {/if}
    </button>
</div>

<style>
    #play-container {
        position: absolute;
        z-index: 10;
    }

    #run-button {
        transition: all ease-in 150ms;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        cursor: pointer;
        box-shadow: 2px -7px 17px -5px rgba(0, 0, 0, 0.35);
    }

    #run-button:hover {
        background-color: var(--run-button-bg-color-hover);
        transform: scale(1.1, 1.1);
    }

    #run-button:disabled {
        cursor: not-allowed;
    }

    #run-button:focus {
        outline: 0;
    }
</style>
