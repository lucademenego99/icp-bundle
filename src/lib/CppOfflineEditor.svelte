<svelte:options tag="cpp-editor" />

<script lang="ts">
    export let type: "normal" | "vertical" = "normal";
    export let theme: "light" | "dark" = "light";
    export let code = "";
    export let id = "";
    export let save = false;
    export let downloadable = false;

    import BaseEditor from "./BaseEditor.svelte";
    import { onMount } from "svelte";
    import { cpp } from "@codemirror/lang-cpp";

    let webworker: SharedWorker;

    function createWorker(): void {
        let baseUrl =
            document.location.protocol +
            "//" +
            document.location.host +
            document.location.pathname;
        baseUrl = baseUrl.substring(0, baseUrl.lastIndexOf("/"));
        baseUrl += "/utils/cpp/";

        webworker = new SharedWorker(baseUrl + "cppWorkerBundle.iife.js", {
            name: "CppWorker",
        });
        webworker.port.start();

        webworker.port.postMessage({ type: "init", baseUrl });
    }

    onMount(() => {
        createWorker();
    });
</script>

<base-editor
    syntax={cpp()}
    {type}
    theme={localStorage.getItem("icp-default-theme") || theme}
    {code}
    {webworker}
    {id}
    {downloadable}
    save={save && id != ""}
    language="cpp"
    on:recreateworker={(event) => {
        createWorker();
    }}
/>
