<svelte:options tag="p5-editor" />

<script lang="ts">
    export let type: "normal" | "vertical" = "normal";
    export let theme: "light" | "dark" = "light";
    export let code = "";

    import BaseEditor from "./BaseEditor.svelte";
    import { onMount } from "svelte";
</script>

<base-editor {type} {theme} {code} webworker={null} language="p5" />
