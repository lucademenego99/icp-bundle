<svelte:options tag="java-editor" />

<script lang="ts">
    export let type: "normal" | "vertical" = "normal";
    export let theme: "light" | "dark" = "light";
    export let code = "";

    import BaseEditor from "./BaseEditor.svelte";
    import JavaWorker from "../modules/workers/java/javaWorker?url";
    import RunWorker from "../modules/workers/java/javaRunWorker?url";
    import TeaWorker from "../modules/workers/java/javaTeaWorker?url";
    import { onMount } from "svelte";

    let webworker: SharedWorker;

    onMount(() => {
        webworker = new SharedWorker(
            JavaWorker,
            { name: "JavaWorker" }
        );
        webworker.port.start();

        const teaworker = new SharedWorker(TeaWorker, { name: "JavaTeaWorker" });

        const workerrun = new SharedWorker(RunWorker, { name: "JavaRunWorker" });

        webworker.port.postMessage({
            worker: "teaworker",
            port: teaworker.port,
            offline: false,
        }, [teaworker.port]);

        webworker.port.postMessage({
            worker: "runworker",
            port: workerrun.port,
        }, [workerrun.port]);
    });
</script>

<base-editor {type} {theme} {code} {webworker} language="java" />
