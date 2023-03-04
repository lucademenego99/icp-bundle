<svelte:options tag="download-button" />

<script lang="ts">
  import type { Language } from "../../types";

  export let language: Language;
  export let theme: "light" | "dark";
  export let type: "normal" | "vertical";
  export let code = "";
  export let id = "";

  let rootElement: HTMLElement;

  let languageToExtension = {
    sql: "sql",
    javascript: "js",
    typescript: "ts",
    python: "py",
    java: "java",
    cpp: "cpp",
    processing: "pde",
    p5: "js",
    ml: "ml",
  };

  let languageToMimeType = {
    sql: "text/x-sql",
    javascript: "text/javascript",
    typescript: "text/typescript",
    python: "text/x-python",
    java: "text/x-java",
    cpp: "text/x-c++src",
    processing: "text/x-processing",
    p5: "text/javascript",
    ml: "text/x-sml",
  };

  /**
   * Downloads the code snippet
   */
  async function downloadSnippet() {
    const name = `${id != "" ? id : "code-snippet"}.${
      languageToExtension[language]
    }`;
    // If showSaveFilePicker is available, save the file using it
    if (window.showSaveFilePicker) {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: name,
        types: [
          {
            description: language,
            accept: {
              [languageToMimeType[language]]: [
                `.${languageToExtension[language]}`,
              ],
            },
          },
        ],
      });

      const writable = await fileHandle.createWritable();
      await writable.write(code);
      await writable.close();
    } else {
      const element = document.createElement("a");
      element.setAttribute(
        "href",
        "data:text/plain;charset=utf-8," + encodeURIComponent(code)
      );
      element.setAttribute("download", name);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  }
</script>

<button
  bind:this={rootElement}
  on:click={() => {
    downloadSnippet();
  }}
  style="position: absolute; right: {type == 'vertical'
    ? `calc(var(--output-height) + min(2vw, 4vh))`
    : `min(2vw, 4vh)`}; top: min(0.5vw, 1vh); padding: 0; border: 0px; border-radius: .4em; display: flex; justify-content: center; width: min(1.5vw, 3vh); height: min(1.5vw, 3vh); align-items: center; z-index: 99; background-color: transparent; cursor: pointer;"
>
  <svg
    style="width: min(1.2vw, 2.4vh); height: min(1.2vw, 2.4vh);"
    fill="none"
    stroke={theme == "dark" ? "#ffffff" : "#000000"}
    stroke-linecap="round"
    stroke-linejoin="round"
    stroke-width="2"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="m7 10 5 5 5-5" />
    <path d="M12 15V3" />
  </svg>
</button>
