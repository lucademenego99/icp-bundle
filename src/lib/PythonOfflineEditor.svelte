<svelte:options tag="python-editor" />

<script lang="ts">
    export let type: "normal" | "vertical" = "normal";
    export let theme: "light" | "dark" = "light";
    export let code = "";

    import BaseEditor from "./BaseEditor.svelte";
    import { pythonWorkerCode } from "../modules/workers/pythonWorker";
    import { onMount } from "svelte";

    let webworker: SharedWorker;

    onMount(() => {
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
        webworker = new SharedWorker(window.URL.createObjectURL(workerBlob));
    });
</script>

<base-editor
    {type}
    {theme}
    {code}
    {webworker}
    offline={true}
    language="python"
/>
