<svelte:options tag="lockunlock-icon" />

<script lang="ts">
    export let isLocked: boolean = true;
</script>

<div class="container" >
    <span class="lock {isLocked ? '' : 'unlocked'}" />
</div>

<style>
    .container {
        display: flex;
        align-items: center;
        justify-content: center;
    }
    /* :::::::::::::: Required CSS */
    /* Locked */
    .lock {
        transform: scale(0.5);
        width: 24px;
        height: 21px;
        border: 3px solid white;
        margin-top: 4px;
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
        width: 3px;
        height: 7px;
        position: absolute;
        top: 50%;
        left: 50%;
        margin: -3.5px 0 0 -2px;
        -webkit-transition: all 0.1s ease-in-out;
        transition: all 0.1s ease-in-out;
    }
    .lock:before {
        content: "";
        display: block;
        width: 10px;
        height: 10px;
        bottom: 100%;
        position: absolute;
        left: 50%;
        margin-left: -8px;
        border: 3px solid white;
        border-top-right-radius: 50%;
        border-top-left-radius: 50%;
        border-bottom: 0;
        -webkit-transition: all 0.1s ease-in-out;
        transition: all 0.1s ease-in-out;
    }
    /* Locked Hover */
    .lock:hover:before {
        height: 12px;
    }
    /* Unlocked */
    .unlocked {
        transform: rotate(10deg) scale(0.5);
    }
    .unlocked:before {
        bottom: 130%;
        left: 31%;
        margin-left: -11.5px;
        transform: rotate(-45deg);
    }
    .unlocked,
    .unlocked:before {
        border-color: white;
    }
    .unlocked:after {
        background: white;
    }
    /* Unlocked Hover */
    .unlocked:hover {
        transform: rotate(3deg) scale(0.5);
    }
    .unlocked:hover:before {
        height: 10px;
        left: 40%;
        bottom: 124%;
        transform: rotate(-30deg);
    }
</style>
