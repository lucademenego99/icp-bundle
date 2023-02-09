<svelte:options tag="processing-editor" />

<script lang="ts">
    export let theme: "light" | "dark" = "light";
    export let code = "";
    export let id = "";
    export let save = false;
    export let downloadable = false;

    import BaseEditor from "./BaseEditor.svelte";
    import { onMount } from "svelte";
    import { java } from "@codemirror/lang-java";
</script>

<base-editor
    type="vertical"
    syntax={java()}
    {theme}
    {code}
    {id}
    {downloadable}
    save={save && id != ""}
    webworker={null}
    language="processing"
/>
