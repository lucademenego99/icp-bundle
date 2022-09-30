<svelte:options tag="overlay-message" />

<script lang="ts">
    /**
     * PROPS
     */
    export let type: "normal" | "vertical" = "normal";
    export let message: string;
    export let show: boolean;
</script>

<!-- Overlay Message -->
<div
    style="{show ? 'opacity: 1;' : 'opacity: 0;'} {type == 'vertical'
        ? 'width: 50%; left: 35%; top: 50%;'
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
        font-size: 2vmin;
        top: 40%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: black;
        color: white;
    }
</style>
