<svelte:options tag="processing-editor" />

<script lang="ts">
    export let theme: "light" | "dark" = "light";
    export let code = "";
    export let id = "";
    export let save = false;

    import BaseEditor from "./BaseEditor.svelte";
    import { onMount } from "svelte";
</script>

<base-editor
    type="vertical"
    {theme}
    {code}
    {id}
    save={save && id != ""}
    webworker={null}
    language="processing"
/>
