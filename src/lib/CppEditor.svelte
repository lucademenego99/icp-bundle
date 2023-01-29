<svelte:options tag="cpp-editor" />

<script lang="ts">
    export let type: "normal" | "vertical" = "normal";
    export let theme: "light" | "dark" = "light";
    export let code = "";

    import BaseEditor from "./BaseEditor.svelte";
    import CppWorker from "../modules/workers/cppWorker?url";
    import { onMount } from "svelte";

    let webworker: SharedWorker;

    function createWorker(): void {
        console.log("WORKER:", CppWorker);
        webworker = new SharedWorker(CppWorker, {
            name: "CppWorker",
            type: "module",
        });
        webworker.port.start();

        webworker.port.postMessage({ type: "init" });
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
    language="cpp"
    on:recreateworker={(event) => {
        createWorker();
    }}
/>
