let isReady;
let javaMessages = [];
let javaErrorMessages = [];
let codeFinished = true;
let teaworker;

// Customize the onmessage event
onmessage = async (message) => {
    // Evaluate the script and
    // Send the output:
    // - debug: console.log results
    // - result: final result of the script
    try {
        let output;
        switch (message.data.language) {
            /**
             * Javascript
             */
            case 'java':
                codeFinished = false;
                compileAndRun(message.data.script, 1, !isReady, ({ message, start, end, severity }) => {
                    console.log("COMPILE FAILED CALLBACK IMPLEMENTATION! ", message);
                    // codeFinished = true;
                    // javaMessages = [];
                    javaErrorMessages.push(message);
                    // throw new Error(message);
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
        const debug = javaMessages.join("\n");
        javaMessages = [];
        postMessage({
            "debug": debug,
            "result": output
        });
    } catch (e) {
        postMessage({
            "error": e
        });
    }
}

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

function createTeaWorker(whenReady) {
    if (teaworker === undefined) {
        try {
            teaworker = new Worker('./teaWorker.js');
        } catch (e) {
            console.log("TEAWORKER CATCH", e);
        }

        teaworker.addEventListener('message', (e) => {
            if (e.data.command == 'ok' && e.data.id == 'didload-classlib') {
                isReady = true
                if (whenReady) {
                    whenReady()
                }
            }
        })

        //bootstrap environment
        teaworker.postMessage({
            command: 'load-classlib',
            id: 'didload-classlib',
            url: 'classlib.txt',
        })

        return true
    }

    return false
}



function compileAndRun(code, questionID, runCreate = true, compileFailedCallback = ({ message, start, end, severity }) => { }) {
    if (runCreate) {
        if (
            createTeaWorker(() => {
                compileAndRun(code, false);
            })
        ) {
            return
        }
    }

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
            if (compileFailedCallback) {
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
            }

            const msg = e.data.text + '\n'
            if (e.data.severity == 'ERROR') {
                console.log("ERR", msg);
            } else {
                console.log("INFO", msg);
            }
        } else if (e.data.command == 'compiler-diagnostic') {
            if (compileFailedCallback) {
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
            }

            const msg = e.data.humanReadable + '\n'
            if (e.data.kind == 'ERROR') {
                console.log("ERR", msg);
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

            const workerrun = new Worker("jobWorker.js");

            const runListener = (ee) => {
                if (ee.data.command == 'run-completed') {
                    console.log("RUN COMPLETE ", ee.data);
                    codeFinished = true;
                } else if (ee.data.command == 'stdout') {
                    javaMessages.push(ee.data.line);
                    console.log(ee.data.line + '\n')
                } else if (ee.data.command == 'stderr') {
                    javaErrorMessages.push(ee.data.line);
                    console.log(ee.data.line + '\n')
                } else if (ee.data.command == 'f-FINAL') {
                    // options.resultData = JSON.parse(ee.data.value)
                }
            }
            workerrun.addEventListener('message', runListener.bind(this));
            workerrun.postMessage({
                command: 'run',
                id: '' + questionID,
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
