import * as ts from 'typescript';

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
