<svelte:options tag="typescript-editor" />

<script lang="ts">
    export let type: "normal" | "vertical" = "normal";
    export let theme: "light" | "dark" = "light";
    export let code = "";
    export let id = "";
    export let save = false;

    import BaseEditor from "./BaseEditor.svelte";
    import { onMount } from "svelte";
    import TypescriptWorker from "../modules/workers/typescriptWorker?worker&inline";

    let webworker: Worker;

    onMount(() => {
        webworker = new TypescriptWorker();
    });
</script>

<base-editor
    {type}
    {theme}
    {code}
    {webworker}
    {id}
    save={save && id != ""}
    language="typescript"
    on:recreateworker={(event) => {
        webworker = new TypescriptWorker();
    }}
/>
