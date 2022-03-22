/* Worker Script to run the provided code */

export function workerFunction() {
    // Check if the typescript module has already been downloaded
    let typescriptDownloaded = false;

    // Customize the onmessage event
    onmessage = e => {
        // Array with all console.log results
        let messages = [];

        // Keep a reference to some old console functions
        const oldConsoleLog = console.log;
        const oldConsoleAssert = console.assert;

        // Rewrite console functions
        console = {};
        console.log = msg => {
            messages.push(msg);
        };
        console.info = msg => {
            messages.push(msg);
        };
        console.warn = msg => {
            messages.push(msg);
        };
        console.error = msg => {
            messages.push(msg);
        };
        console.debug = msg => {
            messages.push(msg);
        };
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
                case 'javascript':
                    output = eval(e.data.script);
                    break;
                case 'typescript':
                    // If typescript has not been downloaded it, import it
                    if (!typescriptDownloaded) {
                        importScripts('https://unpkg.com/typescript@4.6.2/lib/typescript.js');
                        typescriptDownloaded = true;
                    }
                    output = eval(ts.transpile(e.data.script));
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