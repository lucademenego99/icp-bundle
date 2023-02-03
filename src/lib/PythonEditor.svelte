<svelte:options tag="python-editor" />

<script lang="ts">
    export let type: "normal" | "vertical" = "normal";
    export let theme: "light" | "dark" = "light";
    export let code = "";
    export let id = "";
    export let save = false;
    export let downloadable = false;

    import BaseEditor from "./BaseEditor.svelte";
    import PythonWorker from "../modules/workers/pythonWorker?url";
    import { onMount } from "svelte";

    let webworker: SharedWorker;

    function createWorker(): void {
        webworker = new SharedWorker(PythonWorker, {
            name: "PythonWorker",
        });
        webworker.port.start();

        webworker.port.postMessage({
            type: "init",
        });
    }

    onMount(() => {
        createWorker();
    });
</script>

<base-editor
    {type}
    {theme}
    {code}
    {webworker}
    {id}
    {downloadable}
    save={save && id != ""}
    language="python"
    on:recreateworker={(event) => {
        createWorker();
    }}
/>
