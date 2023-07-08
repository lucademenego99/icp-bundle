<svelte:options tag="java-editor" />

<script lang="ts">
    export let type: "normal" | "vertical" = "normal";
    export let theme: "light" | "dark" = "light";
    export let code = "";
    export let id = "";
    export let save = false;
    export let downloadable = false;

    import BaseEditor from "./BaseEditor.svelte";
    import { onMount } from "svelte";
    import { java } from "@codemirror/lang-java";

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

        let baseUrl =
            document.location.protocol +
            "//" +
            document.location.host +
            document.location.pathname;
        baseUrl = baseUrl.substring(0, baseUrl.lastIndexOf("/"));
        baseUrl += "/utils/java/";

        webworker = new SharedWorker(baseUrl + "javaWorker.js", {
            name: "JavaWorker",
        });
        webworker.port.start();

        const teaworker = new SharedWorker(baseUrl + "javaTeaWorker.js", {
            name: "JavaTeaWorker",
        });

        const workerrun = new SharedWorker(baseUrl + "javaRunWorker.js", {
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
    syntax={java()}
    {type}
    theme={localStorage.getItem("icp-default-theme") || theme}
    {code}
    {webworker}
    {id}
    {downloadable}
    save={save && id != ""}
    offline={true}
    language="java"
    on:recreateworker={(event) => {
        createWorker();
    }}
/>
