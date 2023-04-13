<svelte:options tag="settings-button" />

<script lang="ts">
    /**
     * IMPORTS
     */
    import type { Compartment } from "@codemirror/state";
    import type { EditorView } from "@codemirror/view";
    import { onMount } from "svelte";
    import { setEditableFilter, setTabsHandling } from "../../utils";

    /**
     * PROPS
     */
    export let type: "normal" | "vertical" = "normal";
    export let editor: EditorView;
    export let tabsconf: Compartment;
    export let editableconf: Compartment;
    export let code: string;

    /**
     * ELEMENTS
     */
    let ref: HTMLElement;
    let settingsButtonContainer: HTMLElement;
    let copyContainer: HTMLElement;
    let tabsContainer: HTMLElement;
    let resetContainer: HTMLElement;
    let textLockedContainer: HTMLElement;

    /**
     * VARIABLES
     */
    let tabsEnabled = false;

    let isTextLocked = true;

    /**
     * FUNCTIONS
     */

    /**
     * Send an event with the message that needs to be displayed
     * @param message the message to be displayed
     */
    function showMessage(message: string) {
        const event = new CustomEvent("showmsg", {
            detail: message,
            bubbles: true,
            cancelable: true,
            composed: true,
        });
        ref?.dispatchEvent(event);
    }

    /**
     * Send an event to reset the code output
     */
     function resetOutput() {
        const event = new CustomEvent("changedout", {
        detail: {
            output: "",
            outputError: false,
        },
        bubbles: true,
        cancelable: true,
        composed: true,
        });
        ref?.dispatchEvent(event);
    }

    /**
     * On mount, add the event listeners for every button
     */
    onMount(() => {
        // Define the behavior of the copy button when clicked
        copyContainer.addEventListener("click", (e) => {
            var copyText = editor.state.doc.toString();
            navigator.clipboard.writeText(copyText);
            settingsButtonContainer.click();
            showMessage("Text Copied!");
        });

        // Define the behavior of the tabs button when clicked
        tabsContainer.addEventListener("click", (e) => {
            tabsEnabled = !tabsEnabled;
            setTabsHandling(editor, tabsconf, tabsEnabled);
            settingsButtonContainer.click();
            showMessage(
                tabsEnabled ? "Tabs handling enabled" : "Tabs handling disabled"
            );
        });

        // Define the behavior of the reset button when clicked
        resetContainer.addEventListener("click", (e) => {
            editor.dispatch({
                changes: [
                    {
                        from: 0,
                        to: editor.state.doc.length,
                        insert: isTextLocked
                            ? code
                            : code
                                  .replaceAll("<EDITABLE>", "")
                                  .replaceAll("</EDITABLE>", ""),
                    },
                ],
            });
            resetOutput();
            settingsButtonContainer.click();
            showMessage("Code reset!");
        });

        // Define the behavior of the text locked button when clicked
        textLockedContainer.addEventListener("click", (e) => {
            // Emulate click on reset button
            resetContainer.click();

            // Toggle the text locked state
            isTextLocked = !isTextLocked;
            setEditableFilter(editor, editableconf, code, isTextLocked);
            showMessage(isTextLocked ? "Text locked" : "Text unlocked");
        });
    });
</script>

<div
    bind:this={ref}
    id="settings-container"
    style={type == "vertical"
        ? `right: calc(var(--output-height) + min(0.7vw, 1.4vh) + 1px); bottom: min(4.5vw, 9vh)`
        : `right: min(0.4vw, 0.8vh); bottom: calc(var(--output-height) + min(4.7vw, 9.4vh))`}
>
    <div class="menu">
        <input
            type="checkbox"
            class="menu-open"
            name="menu-open"
            id="menu-open"
            bind:this={settingsButtonContainer}
        />
        <label id="settings-button" class="settings-button" for="menu-open">
            <svg
                class="settings"
                style="width: min(0.8vw, 1.6vh); height: min(0.8vw, 1.6vh)"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M8.20442 13.6177H5.7956C5.64467 13.6177 5.49827 13.5661 5.38067 13.4715C5.26308 13.3769 5.18135 13.2449 5.14905 13.0975L4.87972 11.8507C4.52042 11.6933 4.17972 11.4964 3.86391 11.2638L2.64825 11.6509C2.50435 11.6968 2.34909 11.6921 2.20825 11.6375C2.06741 11.583 1.94946 11.4819 1.87398 11.3511L0.666921 9.26589C0.592238 9.13495 0.564204 8.98254 0.587405 8.83359C0.610607 8.68465 0.68367 8.54798 0.794642 8.44596L1.73766 7.58567C1.69477 7.19596 1.69477 6.80273 1.73766 6.41302L0.794642 5.55471C0.683513 5.45265 0.61035 5.31587 0.587145 5.16677C0.56394 5.01768 0.592069 4.86513 0.666921 4.73412L1.87133 2.64758C1.94681 2.51676 2.06476 2.41569 2.2056 2.36116C2.34645 2.30663 2.50171 2.30191 2.6456 2.3478L3.86126 2.73493C4.02273 2.61581 4.19082 2.50464 4.3642 2.40405C4.53163 2.31008 4.70369 2.22471 4.87972 2.14861L5.14972 0.903167C5.18186 0.755725 5.26343 0.623696 5.3809 0.528972C5.49837 0.434247 5.64469 0.382517 5.7956 0.382359H8.20442C8.35533 0.382517 8.50165 0.434247 8.61912 0.528972C8.73659 0.623696 8.81816 0.755725 8.85031 0.903167L9.12295 2.14927C9.48179 2.30761 9.82239 2.50442 10.1388 2.73626L11.3551 2.34912C11.4989 2.30341 11.654 2.30821 11.7947 2.36273C11.9354 2.41725 12.0532 2.51822 12.1287 2.6489L13.3331 4.73545C13.4866 5.00479 13.4337 5.3456 13.2054 5.55537L12.2624 6.41567C12.3052 6.80537 12.3052 7.19861 12.2624 7.58832L13.2054 8.44861C13.4337 8.65905 13.4866 8.9992 13.3331 9.26854L12.1287 11.3551C12.0532 11.4859 11.9353 11.587 11.7944 11.6415C11.6536 11.696 11.4983 11.7007 11.3544 11.6549L10.1388 11.2677C9.82319 11.5002 9.48271 11.6969 9.12361 11.8541L8.85031 13.0975C8.81803 13.2448 8.73641 13.3767 8.61895 13.4713C8.50148 13.5659 8.35524 13.6175 8.20442 13.6177V13.6177ZM6.99736 4.35295C6.29532 4.35295 5.62203 4.63183 5.12561 5.12825C4.62919 5.62467 4.3503 6.29796 4.3503 7.00001C4.3503 7.70205 4.62919 8.37534 5.12561 8.87176C5.62203 9.36818 6.29532 9.64707 6.99736 9.64707C7.69941 9.64707 8.3727 9.36818 8.86912 8.87176C9.36554 8.37534 9.64442 7.70205 9.64442 7.00001C9.64442 6.29796 9.36554 5.62467 8.86912 5.12825C8.3727 4.63183 7.69941 4.35295 6.99736 4.35295V4.35295Z"
                    fill="white"
                />
            </svg>
        </label>

        <div
            bind:this={copyContainer}
            class="menu-item"
            style="background-color: #00CC3D;"
        >
            <svg
                style="width: min(0.62vw, 1.24vh); height: min(0.72vw, 1.44vh);"
                viewBox="0 0 12 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M10.0625 0.682514C10.0625 0.592517 10.0447 0.503409 10.0101 0.420318C9.97556 0.337227 9.92489 0.261794 9.86105 0.19836C9.79721 0.134927 9.72146 0.0847456 9.63815 0.0507051C9.55484 0.0166647 9.46562 -0.000562877 9.37562 1.40238e-05H0.686875C0.59688 -0.000562877 0.50766 0.0166647 0.42435 0.0507051C0.341039 0.0847456 0.265284 0.134927 0.201444 0.19836C0.137604 0.261794 0.0869395 0.337227 0.0523675 0.420318C0.0177954 0.503409 -1.84891e-06 0.592517 1.44068e-10 0.682514V11.5675C-1.84891e-06 11.6575 0.0177954 11.7466 0.0523675 11.8297C0.0869395 11.9128 0.137604 11.9882 0.201444 12.0517C0.265284 12.1151 0.341039 12.1653 0.42435 12.1993C0.50766 12.2334 0.59688 12.2506 0.686875 12.25H0.914375V0.905639H10.0625V0.682514Z"
                    fill="white"
                />
                <path
                    d="M11.1562 1.75H2.40625C2.04381 1.75 1.75 2.04381 1.75 2.40625V13.3437C1.75 13.7062 2.04381 14 2.40625 14H11.1562C11.5187 14 11.8125 13.7062 11.8125 13.3437V2.40625C11.8125 2.04381 11.5187 1.75 11.1562 1.75Z"
                    fill="white"
                />
            </svg>
        </div>
        <div
            bind:this={tabsContainer}
            class="menu-item"
            style="background-color: {tabsEnabled ? '#00cc3d' : '#ff4133'}"
        >
            <svg
                style="width: min(0.72vw, 1.44vh); height: min(0.62vw, 1.24vh);"
                viewBox="0 0 14 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M14 0.7C14 0.514348 13.9263 0.336301 13.795 0.205025C13.6637 0.0737497 13.4857 0 13.3 0C13.1143 0 12.9363 0.0737497 12.805 0.205025C12.6738 0.336301 12.6 0.514348 12.6 0.7V10.5C12.6 10.6857 12.6738 10.8637 12.805 10.995C12.9363 11.1262 13.1143 11.2 13.3 11.2C13.4857 11.2 13.6637 11.1262 13.795 10.995C13.9263 10.8637 14 10.6857 14 10.5V0.7ZM6.09467 0.205333C5.96197 0.0816851 5.78646 0.0143704 5.60511 0.01757C5.42377 0.0207697 5.25074 0.094234 5.12249 0.222486C4.99423 0.350738 4.92077 0.523765 4.91757 0.705112C4.91437 0.88646 4.98169 1.06197 5.10533 1.19467L8.81067 4.9H0.7C0.514348 4.9 0.336301 4.97375 0.205025 5.10503C0.0737497 5.2363 0 5.41435 0 5.6C0 5.78565 0.0737497 5.9637 0.205025 6.09497C0.336301 6.22625 0.514348 6.3 0.7 6.3H8.81067L5.10533 10.0053C5.03656 10.0694 4.9814 10.1467 4.94314 10.2326C4.90488 10.3184 4.88431 10.4111 4.88265 10.5051C4.88099 10.5991 4.89828 10.6925 4.93349 10.7796C4.96869 10.8668 5.02109 10.946 5.08756 11.0124C5.15404 11.0789 5.23321 11.1313 5.32038 11.1665C5.40754 11.2017 5.5009 11.219 5.59489 11.2174C5.68888 11.2157 5.78157 11.1951 5.86744 11.1569C5.9533 11.1186 6.03058 11.0634 6.09467 10.9947L10.9947 6.09467C11.1258 5.96342 11.1994 5.7855 11.1994 5.6C11.1994 5.4145 11.1258 5.23658 10.9947 5.10533L6.09467 0.205333Z"
                    fill="white"
                />
            </svg>
        </div>
        <div
            bind:this={resetContainer}
            class="menu-item"
            style="background-color: #ff4133"
        >
            <svg
                style="width: min(0.65vw, 1.3vh); height: min(0.65vw, 1.3vh)"
                viewBox="0 0 13 13"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M6.48807 1.0568e-05C4.75119 0.00312952 3.17418 0.687569 2.00989 1.80022L1.07384 0.86417C0.677546 0.46788 0 0.748533 0 1.30895V4.82259C0 5.17 0.281623 5.45162 0.629032 5.45162H4.14268C4.70309 5.45162 4.98374 4.77408 4.58748 4.37779L3.49323 3.28353C4.30216 2.5261 5.3489 2.10653 6.46095 2.09694C8.88267 2.07603 10.924 4.03586 10.9031 6.53796C10.8832 8.91154 8.95889 10.9032 6.5 10.9032C5.42207 10.9032 4.4033 10.5185 3.60042 9.81407C3.47611 9.70501 3.28837 9.71164 3.17142 9.82856L2.1319 10.8681C2.0042 10.9958 2.01052 11.204 2.14453 11.325C3.29712 12.3661 4.82452 13 6.5 13C10.0898 13 13 10.0899 13 6.50006C13 2.91434 10.0738 -0.0064108 6.48807 1.0568e-05Z"
                    fill="white"
                />
            </svg>
        </div>
        <div
            bind:this={textLockedContainer}
            class="menu-item"
            style="background-color: {isTextLocked
                ? '#ff4133'
                : '#00cc3d'}; {!editableconf || !editableconf.get(editor.state)
                ? 'display: none !important'
                : ''}"
        >
            <div class="container">
                <span class="lock {isTextLocked ? '' : 'unlocked'}" />
            </div>
        </div>
    </div>
</div>

<style>
    #settings-container {
        position: absolute;
        z-index: 10;
    }
    #settings-button {
        transition: all ease-in 150ms;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        cursor: pointer;
        box-shadow: 2px -7px 17px -5px rgba(0, 0, 0, 0.35);
    }

    .menu-item,
    .settings-button {
        cursor: pointer;
        background: #5f5f5f;
        border-radius: 100%;
        width: min(1.85vw, 3.7vh);
        height: min(1.85vw, 3.7vh);
        margin-left: max(-1.85vw, -3.7vh);
        position: absolute;
        transition: all ease-in-out 200ms;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .menu-open {
        display: none;
    }
    .menu-item:nth-child(3) {
        transition-duration: 70ms;
    }
    .menu-item:nth-child(4) {
        transition-duration: 130ms;
    }
    .menu-item:nth-child(5) {
        transition-duration: 190ms;
    }
    .menu-item:nth-child(6) {
        transition-duration: 250ms;
    }
    .settings-button {
        z-index: 2;
        transition-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275);
        transition-duration: 400ms;
        transform: scale(1.1, 1.1);
        cursor: pointer;
    }
    .settings-button:hover {
        transform: scale(1.2, 1.2);
    }
    .menu-open:checked + .settings-button {
        transition-timing-function: linear;
        transition-duration: 200ms;
        transform: scale(0.8, 0.8);
    }
    .menu-open:checked ~ .menu-item {
        transition-timing-function: cubic-bezier(0.935, 0, 0.34, 1.33);
    }
    .menu-open:checked ~ .menu-item:nth-child(3) {
        transition-duration: 160ms;
        transform: translate3d(max(-2.5vw, -5vh), 0, 0);
    }
    .menu-open:checked ~ .menu-item:nth-child(4) {
        transition-duration: 240ms;
        transform: translate3d(max(-2.5vw, -5vh), max(-2.5vw, -5vh), 0);
    }
    .menu-open:checked ~ .menu-item:nth-child(5) {
        transition-duration: 320ms;
        transform: translate3d(0, max(-2.5vw, -5vh), 0);
    }
    .menu-open:checked ~ .menu-item:nth-child(6) {
        transition-duration: 400ms;
        transform: translate3d(0, max(-5vw, -10vh), 0);
    }

    /* Lock icon CSS */
    .container {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .lock {
        transform: scale(0.5);
        width: 60%;
        height: 52.5%;
        border: min(0.25vw, 0.5vh) solid white;
        margin-top: 12.5%;
        border-radius: 5px;
        position: relative;
        cursor: pointer;
        -webkit-transition: all 0.1s ease-in-out;
        transition: all 0.1s ease-in-out;
    }
    .lock:after {
        content: "";
        display: block;
        background: white;
        width: 10%;
        height: 23.3%;
        position: absolute;
        top: 50%;
        left: 50%;
        margin: -11.7% 0 0 -6.7%;
        -webkit-transition: all 0.1s ease-in-out;
        transition: all 0.1s ease-in-out;
    }
    .lock:before {
        content: "";
        display: block;
        width: 33.3%;
        height: 50%;
        bottom: 105%;
        position: absolute;
        left: 40%;
        margin-left: -26.7%;
        border: min(0.25vw, 0.5vh) solid white;
        border-top-right-radius: 50%;
        border-top-left-radius: 50%;
        border-bottom: 0;
        -webkit-transition: all 0.1s ease-in-out;
        transition: all 0.1s ease-in-out;
    }
    .lock:hover:before {
        height: 40%;
    }
    .unlocked {
        transform: rotate(10deg) scale(0.5);
        margin-top: 26.7%;
    }
    .unlocked:before {
        bottom: 120%;
        left: 31%;
        margin-left: -38.3%;
        transform: rotate(-45deg);
    }
    .unlocked,
    .unlocked:before {
        border-color: white;
    }
    .unlocked:after {
        background: white;
    }
    .unlocked:hover {
        transform: rotate(3deg) scale(0.5);
    }
    .unlocked:hover:before {
        height: 33.3%;
        left: 40%;
        bottom: 124%;
        transform: rotate(-30deg);
    }
</style>
