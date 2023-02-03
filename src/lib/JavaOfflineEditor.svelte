<svelte:options tag="java-editor" />

<script lang="ts">
    export let type: "normal" | "vertical" = "normal";
    export let theme: "light" | "dark" = "light";
    export let code = "";
    export let id = "";
    export let save = false;

    import BaseEditor from "./BaseEditor.svelte";
    import { onMount } from "svelte";

    let webworker: SharedWorker;

    function createWorker() {
        /**
         * All the workers are loaded by default from /utils/java/...js
         *
         * It seems there is no better way to make it work:
         * what we would like to have is an importScripts within javaTeaWorker that loads a local script,
         * but this inevitably leads to CORS errors.
         * We cannot even use a relative path, because when importing the workers with ?url
         * or with ?sharedworker the relative path won't be correct.
         *
         * By creating the workers giving an absolute path to the scripts instead, the importScripts will work.
         */

        webworker = new SharedWorker("/utils/java/javaWorker.js", {
            name: "JavaWorker",
        });
        webworker.port.start();

        let baseUrl =
            document.location.protocol +
            "//" +
            document.location.host +
            document.location.pathname;
        baseUrl = baseUrl.substring(0, baseUrl.lastIndexOf("/"));
        baseUrl += "/utils/java/";

        const teaworker = new SharedWorker("/utils/java/javaTeaWorker.js", {
            name: "JavaTeaWorker",
        });

        const workerrun = new SharedWorker("/utils/java/javaRunWorker.js", {
            name: "JavaRunWorker",
        });

        webworker.port.postMessage(
            {
                worker: "teaworker",
                port: teaworker.port,
                offline: true,
                baseUrl: baseUrl,
            },
            [teaworker.port]
        );

        webworker.port.postMessage(
            {
                worker: "runworker",
                port: workerrun.port,
            },
            [workerrun.port]
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
    offline={true}
    language="java"
    on:recreateworker={(event) => {
        createWorker();
    }}
/>
