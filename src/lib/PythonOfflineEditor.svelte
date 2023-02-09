<svelte:options tag="python-editor" />

<script lang="ts">
    export let type: "normal" | "vertical" = "normal";
    export let theme: "light" | "dark" = "light";
    export let code = "";
    export let id = "";
    export let save = false;
    export let downloadable = false;

    import BaseEditor from "./BaseEditor.svelte";
    import { pythonWorkerCode } from "../modules/workers/pythonOfflineWorker";
    import { onMount } from "svelte";
    import { python } from "@codemirror/lang-python";

    let webworker: SharedWorker;

    function createWorker(): void {
        let baseUrl =
            document.location.protocol +
            "//" +
            document.location.host +
            document.location.pathname;
        baseUrl = baseUrl.substring(0, baseUrl.lastIndexOf("/"));
        baseUrl += "/utils/python/pyodide/";

        // Get the body of the webworker's function
        var workerJob = pythonWorkerCode
            .toString()
            .slice(
                pythonWorkerCode.toString().indexOf("{") + 1,
                pythonWorkerCode.toString().lastIndexOf("}")
            );
        // Generate a blob from it
        var workerBlob = new Blob([workerJob], { type: "text/javascript" });
        // The webworker constructor needs an URL: create it from the blob
        webworker = new SharedWorker(window.URL.createObjectURL(workerBlob), {
            name: "PythonWorker",
        });
        webworker.port.start();

        webworker.port.postMessage({
            type: "init",
            baseUrl: baseUrl,
        });
    }

    onMount(() => {
        createWorker();
    });
</script>

<base-editor
    syntax={python()}
    {type}
    {theme}
    {code}
    {webworker}
    {id}
    {downloadable}
    save={save && id != ""}
    offline={true}
    language="python"
    on:recreateworker={(event) => {
        createWorker();
    }}
/>
