let runtimeInitialized = false;
let isReady;
let javaMessages = [];
let javaErrorMessages = [];
let codeFinished = true;
let teaworker;
let runWorker;
let offline = false;
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
                        isReady = true
                    }
                })
                teaworker.start();
        
                // Bootstrap environment
                if (!runtimeInitialized) {
                    console.log("Posting message load-classlib");
                    teaworker.postMessage({
                        command: 'load-classlib',
                        id: 'didload-classlib',
                        url: message.data.offline ? message.data.baseUrl + "classlib.txt" : "https://lucademenego99.github.io/icp-bundle/base/utils/java/classlib.txt"
                    })

                    // Prevent other instanaces of ICP to re-initialize the runtime by setting this flag
                    runtimeInitialized = true;
                }
            } else if (message.data.worker == "runworker") {
                    runWorker = message.data.port;

                    const runListener = (ee) => {
                        if (ee.data.command == 'run-completed') {
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
                        codeFinished = false;
                        compileAndRun(message.data.script, 1, ({ message, start, end, severity }) => {
                            console.log("COMPILE FAILED CALLBACK IMPLEMENTATION! ", message);
                            javaErrorMessages.push(message);
                        });
                        while (!codeFinished) {
                            await delay(250);
                        }
                        if (javaErrorMessages.length > 0) {
                            javaErrorMessages.pop();
                            const error = javaErrorMessages.join("\n");
                            javaErrorMessages = [];
                            throw new Error(error);
                        }
                        break;

                    default:
                        console.warn("LANGUAGE NOT AVAILABLE");
                        break;
                }
                let debug = javaMessages.join("\n");
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
                    "error": e
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
            //above replaces all {} with [], so look for public class <name> []
            const regexpMainClass =
                /public\s+?class\s+?([a-zA-Z_$0-9]+?)\s*?(\[|\simplements|\sextends)/gm
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
                    console.log("ERR 1", msg);
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
                    console.log("ERR 2", msg);
                } else {
                    console.log("INFO", msg);
                }
            } else if (e.data.command == 'error') {
                if (teaworker) {
                    teaworker.end('Error:  An internal compiler Error occured')
                }
                teaworker = undefined
            } else if (e.data.command == 'compilation-complete') {
                if (teaworker) {
                    teaworker.removeEventListener('message', myListener)
                }

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
                    teaworker.terminate();
                }
                // finishedExecutionCB(false, undefined, options.args)
                if (msg) {
                    console.log("ERR", msg + '\n');
                }
            }
        }
    }

    port.start();
}
