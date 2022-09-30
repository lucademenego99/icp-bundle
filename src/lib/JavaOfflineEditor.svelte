<svelte:options tag="java-editor" />

<script lang="ts">
    export let type: "normal" | "vertical" = "normal";
    export let theme: "light" | "dark" = "light";
    export let code = "";

    import BaseEditor from "./BaseEditor.svelte";
    import JavaWorker from "../modules/workers/javaWorker?worker&inline";
    import { onMount } from "svelte";

    let webworker: Worker;

    onMount(() => {
        webworker = new JavaWorker();
    });
</script>

<base-editor {type} {theme} {code} {webworker} offline={true} language="java" />
