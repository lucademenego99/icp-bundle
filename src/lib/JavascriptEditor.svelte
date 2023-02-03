<svelte:options tag="javascript-editor" />

<script lang="ts">
    export let type: "normal" | "vertical" = "normal";
    export let theme: "light" | "dark" = "light";
    export let code = "";
    export let id = "";
    export let save = false;
    export let downloadable = false;

    import BaseEditor from "./BaseEditor.svelte";
    import { onMount } from "svelte";
    import JavascriptWorker from "../modules/workers/javascriptWorker?worker&inline";

    let webworker: Worker;

    onMount(() => {
        webworker = new JavascriptWorker();
    });
</script>

<base-editor
    {type}
    {theme}
    {code}
    {webworker}
    {id}
    {downloadable}
    save={save && id != ""}
    language="javascript"
    on:recreateworker={(event) => {
        webworker = new JavascriptWorker();
    }}
/>
