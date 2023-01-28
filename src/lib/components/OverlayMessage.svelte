<svelte:options tag="overlay-message" />

<script lang="ts">
    import type { Language } from "../../types";
    
    /**
     * PROPS
     */
    export let type: "normal" | "vertical" = "normal";
    export let language: Language;
    export let message: string;
    export let show: boolean;
</script>

<!-- Overlay Message -->
<div
    style="{show ? 'opacity: 1;' : 'opacity: 0;'} {type == 'vertical'
        ? language == 'p5' || language == 'processing'
            ? 'width: 40%; left: 25%; top: 50%;'
            : 'width: 50%; left: 35%; top: 50%;'
        : ''}"
    id="message"
>
    {message}
</div>

<style>
    #message {
        transition: 500ms;
        position: absolute;
        text-align: center;
        width: 70%;
        pointer-events: none;
        font-family: monospace;
        z-index: 20;
        font-size: min(1.1vw, 2.2vh);
        top: 40%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: black;
        color: white;
    }
</style>
