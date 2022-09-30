<svelte:options tag="javascript-editor" />

<script lang="ts">
    export let type: "normal" | "vertical" = "normal";
    export let theme: "light" | "dark" = "light";
    export let code = "";

    import BaseEditor from "./BaseEditor.svelte";
    import { onMount } from "svelte";
    import JavascriptWorker from "../modules/workers/javascriptWorker?worker&inline";

    let webworker: Worker;

    onMount(() => {
        webworker = new JavascriptWorker();
    });
</script>

<base-editor {type} {theme} {code} {webworker} language="javascript" />
