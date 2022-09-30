import { transpile } from 'typescript';

// Global worker variables
let messages = [];

// Customize the onmessage event
onmessage = async (e) => {
    // Array with all console.log results
    messages = [];

    // Rewrite console functions
    const logRewrite = (msg, ...optionalParams) => {
        messages.push(msg + ' ' + optionalParams.join(' '));
    };
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
        let output = Function(transpile(e.data.script))();

        // Limit the output to 100000 characters
        if (output && output.length > 100000) {
            output = output.substring(0, 100000) + "...";
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
