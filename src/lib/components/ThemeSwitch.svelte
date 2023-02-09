<svelte:options tag="theme-switch" />

<script lang="ts">
    export let theme: "light" | "dark";
    export let type: "normal" | "vertical";

    import { icpDefaultTheme } from "../../stores";

    let rootElement: HTMLElement;

    /**
     * Send an event to the parent, asking to change the theme
     * @param darkMode whether the dark mode should be enabled or not
     */
    function setTheme(darkMode: boolean) {
        // Update the localstorage
        localStorage.setItem("icp-default-theme", darkMode ? "dark" : "light");

        // Set icpDefaultTheme to the new theme for changes to take effect on the whole app
        icpDefaultTheme.set(darkMode ? "dark" : "light");

        // Emit event to the parent
        const event = new CustomEvent("changedtheme", {
            detail: {
                darkMode,
            },
            bubbles: true,
            cancelable: true,
            composed: true,
        });
        rootElement.dispatchEvent(event);
    }

    $: {
        // If a change has been made to the icpDefaultTheme store, update the theme
        // This is needed because the theme is not updated when the user changes the theme
        // from another editor
        if (rootElement && $icpDefaultTheme && $icpDefaultTheme != theme) {
            setTheme($icpDefaultTheme == "dark" ? true : false);
        }
    }
</script>

<button
    bind:this={rootElement}
    on:click={() => {
        setTheme(theme == "light" ? true : false);
    }}
    style="position: absolute; right: {type == 'vertical'
        ? `calc(var(--output-height) + min(0.5vw, 1vh))`
        : `min(0.5vw, 1vh)`}; top: min(2.5vw, 5vh); padding: min(0.25vw, 0.5vh); width: min(1.7vw, 3.4vh); height: min(1.7vw, 3.4vh); border: 0px; border-radius: .4em; display: flex; justify-content: center; align-items: center; z-index: 99; background-color: var(--theme-color); cursor: pointer;"
>
    {#if theme == "dark"}
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="white"
            class="w-6 h-6"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
            />
        </svg>
    {:else}
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="black"
            class="w-6 h-6"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
            />
        </svg>
    {/if}
</button>
