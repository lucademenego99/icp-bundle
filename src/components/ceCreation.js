import { workerFunction } from "./ceWorker";

/**
 * Create a new CodeMirror editor
 * @param document Base root of the HTML document (useful when using shadow dom)
 * @param language Chosen programming language
 * @param enableDarkMode Choose whether to enable dark mode or not
 * @param initialText Editor's default text
 */
export function createCodeMirror(document, language, enableDarkMode = false, initialText = '') {
    // Create the CodeMirror editor
    let res = CodeMirror.createEditor(document.querySelector("#editor"), language, enableDarkMode, initialText);

    // Get access to the editor instance
    let editor = res.editor;

    // Get access to the language configuration, useful to change it dynamically
    let languageConfiguration = res.languageConfiguration;

    // Get access to the tabs configuration, useful to change the tabs handling dynamically
    let tabsEnabled = false;
    let tabsConfiguration = res.tabsConfiguration;

    // Set the current language
    let currentLanguage = language;

    // Get Run Code Button
    var runButton = document.querySelector("#run-button");

    /**
     * Function used to show a given message to the user
     */
    function showMessage(message) {
        var messageContainer = document.querySelector("#message");
        messageContainer.innerText = message;
        messageContainer.style.zIndex = 15;
        messageContainer.style.opacity = 1;

        setTimeout(function () {
            messageContainer.style.opacity = 0;
            messageContainer.style.zIndex = -1;
        }, 1000);
    }

    // Define the behavior of the copy button when clicked
    var copyContainer = document.querySelector("#copy-container");
    copyContainer.addEventListener('click', (e) => {
        var copyText = editor.state.doc.toString()
        navigator.clipboard.writeText(copyText);
        showMessage("Text Copied!");
    });

    // Define the behavior of the tabs button when clicked
    var tabsContainer = document.querySelector("#tabs-container");
    tabsContainer.addEventListener('click', (e) => {
        tabsEnabled = !tabsEnabled;
        let svg = document.querySelector("#tabs-svg");
        svg.classList.toggle("enabled");
        svg.classList.toggle("disabled");
        CodeMirror.setTabsHandling(editor, tabsConfiguration, tabsEnabled);
        showMessage(tabsEnabled ? "Tabs handling enabled" : "Tabs handling disabled");
    });

    // Create a new worker
    let worker;
    if (typeof (Worker) !== undefined) {
        // Get the body of the worker's function
        var workerJob = workerFunction.toString().slice(workerFunction.toString().indexOf("{") + 1, workerFunction.toString().lastIndexOf("}"));
        // Generate a blob from it
        var workerBlob = new Blob([workerJob], { type: "text/javascript" });
        // The worker constructor needs an URL: create it from the blob
        worker = new Worker(window.URL.createObjectURL(workerBlob));

        // Handle the worker's messages
        worker.onmessage = e => {
            enableRunButton();
            if (e.data.error) {
                document.querySelector("#output").classList.add("error");
                document.querySelector("#output").innerText = e.data.error;
            } else {
                document.querySelector("#output").classList.remove("error");
                let text = "";
                if (e.data.debug)
                    text += e.data.debug + "\n\n";
                if (e.data.result)
                    text += "Result: " + e.data.result;
                document.querySelector("#output").innerText = text;
            }
        }
    }

    // Define the click event
    runButton.addEventListener('click', (e) => {
        e.preventDefault;
        runButton.classList.remove('animate');
        runButton.classList.add('animate');
        setTimeout(function () {
            runButton.classList.remove('animate');
        }, 700);
        runCode();
    }, false);

    // Disable Run Button
    function disableRunButton() {
        runButton.disabled = true;
        runButton.classList.add('running');
        runButton.innerText = "Running...";
    }

    // Enable Run Button
    function enableRunButton() {
        runButton.disabled = false;
        runButton.classList.remove('running');
        runButton.innerText = "Run Code!";
    }

    // Run code by calling the worker
    function runCode() {
        disableRunButton();
        // Send to the worker the script to run
        worker.postMessage({
            "language": currentLanguage,
            "script": editor.state.doc.toString(),
            "input": document.querySelector('#input') ? document.querySelector('#input').value : ""
        });
    }
}
