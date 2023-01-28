<svelte:options tag="processing-editor" />

<script lang="ts">
    export let theme: "light" | "dark" = "light";
    export let code = "";

    import BaseEditor from "./BaseEditor.svelte";
    import { onMount } from "svelte";
</script>

<base-editor type="vertical" {theme} {code} webworker={null} language="processing" />
