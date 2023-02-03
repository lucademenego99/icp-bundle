<svelte:options tag="cpp-editor" />

<script lang="ts">
    export let type: "normal" | "vertical" = "normal";
    export let theme: "light" | "dark" = "light";
    export let code = "";
    export let id = "";
    export let save = false;

    import BaseEditor from "./BaseEditor.svelte";
    import CppWorker from "../modules/workers/cpp/cppWorkerBundle.iife.js?url";
    import { onMount } from "svelte";

    let webworker: SharedWorker;

    function createWorker(): void {
        webworker = new SharedWorker(CppWorker, {
            name: "CppWorker",
        });
        webworker.port.start();

        let baseUrl =
            document.location.protocol +
            "//" +
            document.location.host +
            document.location.pathname;
        baseUrl = baseUrl.substring(0, baseUrl.lastIndexOf("/"));
        baseUrl += "/utils/cpp/";
        webworker.port.postMessage({ type: "init", baseUrl });
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
    save={save && id != ""}
    language="cpp"
    on:recreateworker={(event) => {
        createWorker();
    }}
/>
