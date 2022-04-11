/**
 * Worker Script to run the provided code
 */
export function workerFunction() {
    // Global worker variables
    let messages = [];
    let input = '';

    // Keep a reference to some old console functions
    const oldConsoleLog = console.log;
    const oldConsoleAssert = console.assert;

    /**
     * TYPESCRIPT VARS
     */
    let typescriptDownloaded = false;   // Check if the typescript module has already been downloaded

    /**
     * PYTHON VARS
     */
    let pythonDownloaded = false;       // Check if the python module has already been downloaded
    let pythonInitCompleted = false;    // Check if python has been initialized
    let pyodide;                        // Pyodide object used to run python scripts

    // Customize the onmessage event
    onmessage = async (e) => {
        // Array with all console.log results
        messages = [];

        // Set the input
        input = e.data.input;

        // Rewrite console functions
        const logRewrite = (msg, ...optionalParams) => {
            // Don't do anything if we are using python: we will handle it later
            if (e.data.language != "python") {
                messages.push(msg + ' ' + optionalParams.join(' '));
            }
        };
        console = {};
        console.log = logRewrite;
        console.info = logRewrite;
        console.warn = logRewrite;
        console.error = logRewrite;
        console.debug = logRewrite;
        console.assert = msg => {
            if (!msg) {
                messages.push("Wrong Assertion!")
            }
        }

        // Evaluate the script and
        // Send the output:
        // - debug: console.log results
        // - result: final result of the script
        try {
            let output;
            switch (e.data.language) {
                /**
                 * Javascript
                 */
                case 'javascript':
                    output = eval(e.data.script);
                    break;

                /**
                 * Typescript
                 */
                case 'typescript':
                    // If typescript has not been downloaded it, import it
                    if (!typescriptDownloaded) {
                        importScripts('https://unpkg.com/typescript@4.6.2/lib/typescript.js');
                        typescriptDownloaded = true;
                    }
                    output = eval(ts.transpile(e.data.script));
                    break;

                /**
                 * Python
                 */
                case 'python':
                    if (!pythonDownloaded) {
                        importScripts('https://cdn.jsdelivr.net/pyodide/v0.19.1/full/pyodide.js');
                        pythonDownloaded = true;
                        pyodide = await loadPyodide({
                            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.19.1/full/",
                            stdin: () => input,
                            stdout: (text) => {
                                if (pythonInitCompleted) {
                                    messages.push(text);
                                } else if (text.includes('Python initialization complete')) {
                                    pythonInitCompleted = true;
                                }
                            },
                            stderr: (text) => {
                                if (pythonInitCompleted) {
                                    messages.push(text);
                                } else if (text.includes('Python initialization complete')) {
                                    pythonInitCompleted = true;
                                }
                            },
                        });
                    }
                    await pyodide.loadPackagesFromImports(e.data.script);
                    ouptut = pyodide.runPython(e.data.script);
                    break;
                default:
                    console.warn("LANGUAGE NOT AVAILABLE");
                    break;
            }
            postMessage({
                "debug": messages.join("\n"),
                "result": output
            });
        } catch (e) {
            postMessage({
                "error": e
            });
        }
    }
}