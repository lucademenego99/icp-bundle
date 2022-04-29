// import classlib from './classlib.txt?raw';

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
            teaworker = new Worker('/src/modules/workers/teaWorker');
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

        // Create a blob out of classlib
        // const blob = new Blob([classlib], { type: 'application/zip' });
        // const file = new File([blob], 'classlib');
        // const url = URL.createObjectURL(blob);

        //bootstrap environment
        teaworker.postMessage({
            command: 'load-classlib',
            id: 'didload-classlib',
            url: '/src/modules/workers/classlib.txt',
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

            let workerjob = `
                let didRun = false;
                let $stderrBuffer = '';
                let $stdoutBuffer = '';
                let rArgs = [];
                
                const olog = console.log;
                const oerr = console.error;
                console.log = function (line) {
                    olog('[WORKER]', ...arguments);
                }
                
                console.error = function (ch) {
                    oerr('[WORKER]', ...arguments);
                }
                
                function endSession(reqID) {
                    if ($stderrBuffer != '') {
                        self.postMessage({ command: 'stderr', line: $stderrBuffer, id: reqID });
                    }
                    if ($stdoutBuffer != '') {
                        self.postMessage({ command: 'stdout', line: $stdoutBuffer, id: reqID });
                    }
                
                    $stderrBuffer = undefined;
                    $stdoutBuffer = undefined;
                
                    self.postMessage({ command: 'run-completed', id: reqID, args: rArgs });
                }
                
                function listener(event) {
                    let request = event.data;
                    if (request.command == 'session-ended' && didRun) {
                        const reqID = request.id;
                        endSession(reqID);
                    } else if (request.command == 'run' && !didRun) {
                        didRun = true;
                        const reqID = request.id;
                
                        $rt_putStdoutCustom = function (ch) {
                            if (ch === 0xa) {
                                self.postMessage({ command: 'stdout', line: $stdoutBuffer, id: reqID });
                                $stdoutBuffer = '';
                            } else {
                                $stdoutBuffer += String.fromCharCode(ch);
                            }
                        }
                
                        $rt_putStderrCustom = function (ch) {
                            if (ch === 0xa) {
                                self.postMessage({ command: 'stderr', line: $stderrBuffer, id: reqID });
                                $stderrBuffer = '';
                            } else {
                                $stderrBuffer += String.fromCharCode(ch);
                            }
                        }
                
                        $rt_last_run_args = [];
                        let blob = new Blob([request.code], { type: 'application/javascript' });
                        let URLObject = URL.createObjectURL(blob);
                        olog('CODE: ' + request.code);
                        self.importScripts(URLObject);
                        self.postMessage({ command: 'run-finished-setup', id: reqID });
                
                        try {
                            if (request.messagePosting) {
                                self.postMessage({ command: 'main-will-start', id: reqID });
                            }
                            main(request.args);
                            rArgs = $rt_last_run_args.data.map((j) => j.toString());
                            if (request.messagePosting) {
                                self.postMessage({ command: 'main-finished', id: reqID, args: rArgs });
                            }
                        } catch (EE) {
                            if (EE instanceof Error) {
                                console.log('APPLICATION ERROR', EE);
                                $stderrBuffer += 'Application Terminated (' + EE.name + '): ' + EE.message;
                            } else {
                                console.log('APPLICATION ERROR', EE);
                                $stderrBuffer += 'Application Terminated due to an internal Error.';
                            }
                        }
                
                        URLObject = undefined;
                        blob = undefined;
                
                        // self.removeEventListener('message', listener)
                        // if (!request.keepAlive) {
                        endSession(reqID);
                        // }
                    }
                    request = undefined;
                }
                
                onmessage = listener;
            `;
            var workerBlob = new Blob([workerjob], { type: "text/javascript" });
            // The worker constructor needs an URL: create it from the blob
            const workerrun = new Worker(URL.createObjectURL(workerBlob));

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

export { }