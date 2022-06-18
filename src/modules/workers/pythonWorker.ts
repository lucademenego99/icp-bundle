/**
 * Main Worker Function to run Python Code
 */

export function pythonWorkerFunction() {
    // Global worker variables
    let messages = [];
    let input = '';

    // Python useful variables
    let pythonDownloaded = false;       // Check if the python module has already been downloaded
    let pythonInitCompleted = false;    // Check if python has been initialized
    let pyodide;                        // Pyodide object used to run python scripts

    // Customize the onmessage event
    onmessage = async (message) => {
        // Array with all console.log results
        messages = [];

        // Set the input
        input = message.data.input;

        // Evaluate the script and
        // Send the output:
        // - debug: console.log results
        // - result: final result of the script
        try {
            if (!pythonDownloaded) {
                // @ts-ignore
                importScripts("https://cdn.jsdelivr.net/pyodide/v0.20.0/full/pyodide.js");
                pythonDownloaded = true;
                // @ts-ignore - loadPyodide is imported by the previous importScript
                pyodide = await loadPyodide({
                    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.20.0/full/",
                    stdin: () => input,
                    stdout: (text: string): void => {
                        if (pythonInitCompleted) {
                            messages.push(text);
                        } else if (text.includes('Python initialization complete')) {
                            pythonInitCompleted = true;
                        }
                    },
                    stderr: (text: string): void => {
                        if (pythonInitCompleted) {
                            messages.push(text);
                        } else if (text.includes('Python initialization complete')) {
                            pythonInitCompleted = true;
                        }
                    },
                });
            }
            pyodide.globals.clear();
            await pyodide.loadPackagesFromImports(message.data.script);
            let output: string = await pyodide.runPythonAsync(message.data.script);


            let debug = messages.join("\n");
            // Limit debug to 100000 characters
            if (debug.length > 100000) {
                debug = debug.substring(0, 100000) + "...";
            }
            messages = [];

            postMessage({
                "debug": debug,
                "result": output
            });
        } catch (e) {
            e = parsePythonError(e);
            postMessage({
                "error": e.message,
                "line": e.deepest.line + 1,
            });
        }
    }

    /**
    * General Python Error
    */
    type PythonError = {
        message: string;
        trace: Array<{ line: number, file: string, module: string }>;
        deepest: { line: number, file: string, module: string };
    }

    /**
     * Parse the Python error
     * @param err Error message
     * @returns Object containing all the details about the error
     */
    function parsePythonError(err: Error): PythonError {
        const traceback = [];
        let deepest = undefined;
        let msg = '';
        if (err.message) {
            if (err.message.indexOf('Traceback') >= 0) {
                const ep =
                    /File\s*"(\S*?)",\s*line\s*(\d*),\s*in\s*(\S.*)|File\s*"(\S*?)",\s*line\s*(\d*)/gm;
                let m: RegExpExecArray;

                while ((m = ep.exec(err.message)) !== null) {
                    if (m.index === ep.lastIndex) {
                        ep.lastIndex++;
                    }

                    if (m.length >= 4) {
                        if (m[2] && m[1] && m[3]) {
                            traceback.push({ line: parseInt(m[2]) - 1, file: m[1], module: m[3] });
                        } else if (m[4] && m[5]) {
                            traceback.push({ line: parseInt(m[5]) - 1, file: m[4] });
                        }
                    }
                }

                deepest = traceback.reverse().find((t) => t.file === '<exec>' || t.file === '<unknown>');
            }

            const lines = err.message.trim().split('\n');
            if (lines.length > 0) {
                msg = lines[lines.length - 1];
            }
        }

        const res = {
            message: msg,
            trace: traceback,
            deepest: deepest,
        };
        return res
    }
}

export { }
