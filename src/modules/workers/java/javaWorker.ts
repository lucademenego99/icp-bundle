/**
 * Flag specifying if the runtime has been initialized
 */
let runtimeInitialized = false;
/**
 * Flag specifying if the runtime is ready to be used
 */
let isReady;

/**
 * Array of messages sent by the runtime
 * @type {string[]}
 */
let javaMessages = [];

/**
 * Array of errors sent by the runtime
 * @type {string[]}
 */
let javaErrorMessages = [];

/**
 * Flag specifying if the code has finished running
 * @type {boolean}
 */
let codeFinished = true;

/**
 * Port allowing to communicate with the worker that compiles the code
 * @type {MessagePort}
 */
let teaworker;

/**
 * Port allowing to communicate with the worker that runs the code
 * @type {MessagePort}
 */
let runWorker;

/**
 * Flag specifying if the code is running offline
 * @type {boolean}
 */
let offline = false;

/**
 * Base URL from which dependencies are loaded
 * @type {string}
 */
let baseUrl;

onconnect = async (e) => {
    const port = e.ports[0];
    port.addEventListener('message', onmessage);

    // Customize the onmessage event
    async function onmessage(message) {
        if (message.data.port) {
            // A worker has been sent to us, handle it
            if (message.data.worker == "teaworker") {
                teaworker = message.data.port;
                teaworker.addEventListener('message', (e) => {
                    if (e.data.command == 'ok' && e.data.id == 'didload-classlib') {
                        // Run a sample program to completely initialize the runtime and make the next commands faster
                        compileAndRun(`public class Main {public static void main(String[] args) {}}`, 1, ({ message, start, end, severity }) => { });
                    }
                });
                // Start the port
                teaworker.start();

                // Bootstrap environment
                if (!runtimeInitialized) {
                    teaworker.postMessage({
                        command: 'load-classlib',
                        id: 'didload-classlib',
                        url: message.data.offline ? (message.data.baseUrl + "classlib.txt") : "https://lucademenego99.github.io/icp-bundle/base/utils/java/classlib.txt"
                    })

                    // Prevent other instanaces of ICP to re-initialize the runtime by setting this flag
                    runtimeInitialized = true;
                }
            } else if (message.data.worker == "runworker") {
                runWorker = message.data.port;

                const runListener = (ee) => {
                    if (ee.data.command == 'run-completed') {
                        // Set the flag isReady to true
                        isReady = true;
                        // console.log("RUN COMPLETE ", ee.data);
                        codeFinished = true;
                    } else if (ee.data.command == 'stdout') {
                        javaMessages.push(ee.data.line);
                        // console.log(ee.data.line + '\n')
                    } else if (ee.data.command == 'stderr') {
                        javaErrorMessages.push(ee.data.line);
                        // console.log(ee.data.line + '\n')
                    } else if (ee.data.command == 'f-FINAL') {
                        // options.resultData = JSON.parse(ee.data.value)
                    }
                }
                runWorker.addEventListener('message', runListener);

                runWorker.start();
            }
        } else {
            // Evaluate the script and
            // Send the output:
            // - debug: console.log results
            // - result: final result of the script
            try {
                let output;
                offline = message.data.offline;
                baseUrl = message.data.baseUrl;
                switch (message.data.language) {
                    case 'java':
                        if (!isReady) {
                            javaErrorMessages.push("The runtime is not ready. Please retry in a few seconds.");
                            break;
                        }
                        codeFinished = false;
                        compileAndRun(message.data.script, 1, ({ message, start, end, severity }) => {
                            javaErrorMessages.push(`[${severity.toUpperCase()}] (${start.line + 1}:${end.line + 1}) ${message}`);
                        });
                        while (!codeFinished) {
                            await delay(250);
                        }
                        break;

                    default:
                        console.warn("LANGUAGE NOT AVAILABLE");
                        break;
                }
                if (javaErrorMessages.length > 0) {
                    // Loop through the error messages, if all messages contain "WARNING" then don't throw an error
                    let allWarnings = true;
                    for (let i = 0; i < javaErrorMessages.length; i++) {
                        if (!javaErrorMessages[i].startsWith("[WARNING]")) {
                            allWarnings = false;
                            break;
                        }
                    }
                    if (!allWarnings) {
                        const error = javaErrorMessages.join("\n");
                        javaErrorMessages = [];
                        javaMessages = [];
                        throw new Error(error);
                    }
                }
                let debug = "";
                if (javaErrorMessages.length > 0) {
                    debug += javaErrorMessages.join("\n") + "\n\n";
                    javaErrorMessages = [];
                }
                debug += javaMessages.join("\n");
                // Limit debug to 100000 characters
                if (debug.length > 100000) {
                    debug = debug.substring(0, 100000) + "...";
                }
                javaMessages = [];
                port.postMessage({
                    "debug": debug,
                    "result": output
                });
            } catch (e) {
                port.postMessage({
                    "error": e.message
                });
            }
        }
    }

    function delay(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }

    function compileAndRun(code, questionID, compileFailedCallback) {
        let text = code
            .replace(/"(?:[^"\\]|\\.)*"|\/\*[\s\S]*?\*\//gm, '')
            .replace(/(^.*)\/\/.*$/gm, '$1') //replace strings and comments

        // text = text.replaceRec(/(\{[^{}]*\})/gm, '[]') //replace parentheses

        const getMainClass = (_code) => {
            let ret = 'Unknown'
            const regexpMainClass =
                /public\s+class\s+([a-zA-Z_$][a-zA-Z\d_$]*)\s*(?:implements\s+([a-zA-Z_$][a-zA-Z\d_$]*)\s*(?:,\s*[a-zA-Z_$][a-zA-Z\d_$]*)*)?(?:extends\s+([a-zA-Z_$][a-zA-Z\d_$]*)\s*)?\s*\{/gm
            let match;
            while ((match = regexpMainClass.exec(_code)) !== null) {
                if (match[1]) {
                    ret = match[1]
                    break
                }
            }
            return ret
        }
        let mainClass = getMainClass(text)

        //fallback if the above regExps mangled the student code and we can not find the main class
        if (mainClass == 'Unknown') {
            mainClass = getMainClass(code.replace('{', '['))
        }

        const myListener = (e) => {
            if (e.data.command == 'diagnostic') {
                compileFailedCallback({
                    message: e.data.text,
                    start: {
                        line: e.data.lineNumber,
                        column: 0,
                    },
                    end: {
                        line: e.data.lineNumber,
                        column: 0,
                    },
                    severity:
                        e.data.severity == 'ERROR'
                            ? "Error"
                            : "Warning",
                })

                const msg = e.data.text + '\n'
                if (e.data.severity == 'ERROR') {
                    codeFinished = true;
                    console.log("ERR 1", msg);
                    teaworker.removeEventListener('message', myListener)
                } else {
                    console.log("INFO", msg);
                }
            } else if (e.data.command == 'compiler-diagnostic') {
                compileFailedCallback({
                    message: e.data.message,
                    start: {
                        line: e.data.startLineNumber,
                        column: e.data.startColumn,
                    },
                    end: {
                        line: e.data.endLineNumber,
                        column: e.data.endColumn,
                    },
                    severity:
                        e.data.kind == 'ERROR'
                            ? "Error"
                            : "Warning",
                })

                const msg = e.data.humanReadable + '\n'
                if (e.data.kind == 'ERROR') {
                    codeFinished = true;
                    teaworker.removeEventListener('message', myListener)
                    console.log("Compilation Exception", msg);
                } else {
                    console.log("INFO", msg);
                }
            } else if (e.data.command == 'error') {
                if (teaworker) {
                    teaworker.removeEventListener('message', myListener)
                    teaworker.end('Error:  An internal compiler Error occured')
                }
            } else if (e.data.command == 'compilation-complete') {
                if (teaworker) {
                    teaworker.removeEventListener('message', myListener)
                }

                console.log('Compilation complete. Send run command.');

                runWorker.postMessage({
                    command: 'run',
                    id: '' + Math.random(),
                    code: e.data.script,
                    args: [],
                    messagePosting: false,
                    keepAlive: false,
                });
            }
        }

        if (teaworker) {
            teaworker.addEventListener('message', myListener);
        }

        if (teaworker) {
            console.log("Start compilation");
            teaworker.postMessage({
                command: 'compile',
                id: '' + questionID,
                text: code,
                mainClass: mainClass,
            });
        }

        if (teaworker) {
            teaworker.end = (msg, terminate = true) => {
                if (teaworker && terminate) {
                    console.log("WORKER IS BROKEN");
                }
                if (msg) {
                    console.log("ERR", msg + '\n');
                }
            }
        }
    }

    port.start();
}
