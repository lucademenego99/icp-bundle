<svelte:options tag="java-editor" />

<script lang="ts">
    export let type: "normal" | "vertical" = "normal";
    export let theme: "light" | "dark" = "light";
    export let code = "";
    export let id = "";
    export let save = false;

    import BaseEditor from "./BaseEditor.svelte";
    import JavaWorker from "../modules/workers/java/javaWorker?url";
    import RunWorker from "../modules/workers/java/javaRunWorker?url";
    import TeaWorker from "../modules/workers/java/javaTeaWorker?url";
    import { onMount } from "svelte";

    let webworker: SharedWorker;
    let teaworker: SharedWorker;

    function createWorker(): void {
        webworker = new SharedWorker(JavaWorker, { name: "JavaWorker" });
        webworker.port.start();

        teaworker = new SharedWorker(TeaWorker, {
            name: "JavaTeaWorker",
        });

        const workerrun = new SharedWorker(RunWorker, {
            name: "JavaRunWorker",
        });

        webworker.port.postMessage(
            {
                worker: "runworker",
                port: workerrun.port,
            },
            [workerrun.port]
        );

        webworker.port.postMessage(
            {
                worker: "teaworker",
                port: teaworker.port,
                offline: false,
            },
            [teaworker.port]
        );
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
    language="java"
    on:recreateworker={(event) => {
        createWorker();
    }}
/>
