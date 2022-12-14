<svelte:options tag="python-editor" />

<script lang="ts">
    export let type: "normal" | "vertical" = "normal";
    export let theme: "light" | "dark" = "light";
    export let code = "";

    import BaseEditor from "./BaseEditor.svelte";
    import PythonWorker from "../modules/workers/pythonWorker?url";
    import { onMount } from "svelte";

    let webworker: SharedWorker;

    onMount(() => {
        // Get the body of the webworker's function
        webworker = new SharedWorker(PythonWorker, {
            name: "PythonWorker",
        });
        webworker.port.start();

        webworker.port.postMessage({
            type: "init",
        });
    });
</script>

<base-editor {type} {theme} {code} {webworker} language="python" />
