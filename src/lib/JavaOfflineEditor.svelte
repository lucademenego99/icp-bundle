<svelte:options tag="java-editor" />

<script lang="ts">
    export let type: "normal" | "vertical" = "normal";
    export let theme: "light" | "dark" = "light";
    export let code = "";

    import BaseEditor from "./BaseEditor.svelte";
    import JavaWorker from "../modules/workers/java/javaWorker?url";
    import JavaRunWorker from "../modules/workers/java/javaRunWorker?url";
    import TeaWorker from "../modules/workers/java/javaTeaWorkerOffline?url";
    import { onMount } from "svelte";

    let webworker: SharedWorker;

    onMount(() => {
        webworker = new SharedWorker(
            JavaWorker,
            { type: "module", name: "JavaWorker" }
        );
        webworker.port.start();

        let baseUrl =
                document.location.protocol +
                "//" +
                document.location.host +
                document.location.pathname;
            baseUrl = baseUrl.substring(0, baseUrl.lastIndexOf("/"));
            baseUrl +=  "/utils/java/";

        const teaworker = new SharedWorker(TeaWorker, { name: "JavaTeaWorker" });

        const workerrun = new SharedWorker(JavaRunWorker, { name: "JavaRunWorker" });

        webworker.port.postMessage({
            worker: "teaworker",
            port: teaworker.port,
            offline: true,
            baseUrl: baseUrl,
        }, [teaworker.port]);

        webworker.port.postMessage({
            worker: "runworker",
            port: workerrun.port,
        }, [workerrun.port]);
    });
</script>

<base-editor {type} {theme} {code} {webworker} offline={true} language="java" />
