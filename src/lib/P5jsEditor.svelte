<svelte:options tag="p5-editor" />

<script lang="ts">
    export let theme: "light" | "dark" = "light";
    export let code = "";
    export let id = "";
    export let save = false;
    export let downloadable = false;

    import BaseEditor from "./BaseEditor.svelte";
    import { onMount } from "svelte";
    import { javascript } from "@codemirror/lang-javascript";
</script>

<base-editor
    syntax={javascript()}
    type="vertical"
    theme={localStorage.getItem("icp-default-theme") || theme}
    {code}
    {id}
    {downloadable}
    save={save && id != ""}
    webworker={null}
    language="p5"
/>
