<svelte:options tag="sql-editor" />

<script lang="ts">
    export let type: "normal" | "vertical" = "normal";
    export let theme: "light" | "dark" = "light";
    export let code = "";
    export let id = "";
    export let save = false;

    import BaseEditor from "./BaseEditor.svelte";
    import { onMount } from "svelte";
    import SqlWorker from "../modules/workers/sqlWorker?worker&inline";

    let webworker: Worker;

    onMount(() => {
        webworker = new SqlWorker();
    });
</script>

<base-editor
    {type}
    {theme}
    {code}
    {webworker}
    {id}
    save={save && id != ""}
    language="sql"
    on:recreateworker={(event) => {
        webworker = new SqlWorker();
    }}
/>
